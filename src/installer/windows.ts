import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import * as semver from 'semver'
import {VerifyingToolchainInstaller} from './verify'
import {WindowsToolchainSnapshot} from '../snapshot'
import {
  VisualStudioRequirement,
  VisualStudio,
  setupVisualStudioTools,
  setupSupportFiles
} from '../utils'

export class WindowsToolchainInstaller extends VerifyingToolchainInstaller<WindowsToolchainSnapshot> {
  private visualStudio?: VisualStudio

  protected async download() {
    const reccommended = '10.0.17763'
    const current = os.release()
    const version = semver.gte(current, reccommended) ? current : reccommended
    const winsdk = semver.patch(version)
    const vsRequirement: VisualStudioRequirement = {
      version: '16',
      components: [
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        `Microsoft.VisualStudio.Component.Windows10SDK.${winsdk}`,
        'Component.CPython.x64',
        'Microsoft.VisualStudio.Component.VC.CMake.Project'
      ]
    }
    core.debug(`Using Visual Studio requirement ${vsRequirement}`)
    const [visualStudio, toolchain] = await Promise.all([
      setupVisualStudioTools(vsRequirement),
      super.download()
    ])
    this.visualStudio = visualStudio
    const exeFile = `${toolchain}.exe`
    await fs.rename(toolchain, exeFile)
    core.debug(`Toolchain installer downloaded at "${exeFile}"`)
    return exeFile
  }

  protected async unpack(exe: string) {
    core.debug(`Installing toolchain from "${exe}"`)
    const code = await exec(`"${exe}"`, ['-q'])
    if (code !== 0) {
      throw new Error(`Swift installer failed with exit code: "${code}"`)
    }
    const installation = path.join(process.env.SystemDrive ?? 'C:', 'Library')
    const toolchain = path.join(
      installation,
      'Developer',
      'Toolchains',
      'unknown-Asserts-development.xctoolchain'
    )
    const sdkroot = path.join(
      installation,
      'Developer',
      'Platforms',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    const runtime = path.join(
      process.env.SystemDrive ?? 'C:',
      'Program Files',
      'swift'
    )
    core.debug(`Toolchain installed at "${toolchain}"`)
    core.debug(`SDK installed at "${sdkroot}"`)
    try {
      await fs.access(runtime)
      await fs.cp(runtime, path.join(installation, 'swift'), {recursive: true})
      core.debug(`Runtime installed at "${runtime}"`)
    } catch (error) {
      core.debug('No Swift runtime installed')
    }
    return installation
  }

  protected async add(installation: string) {
    const toolchain = path.join(
      installation,
      'Developer',
      'Toolchains',
      'unknown-Asserts-development.xctoolchain'
    )
    const sdkroot = path.join(
      installation,
      'Developer',
      'Platforms',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    core.debug(`Adding toolchain "${toolchain}" to path`)
    const swiftPath = path.join(toolchain, 'usr', 'bin')
    core.exportVariable('SDKROOT', sdkroot)
    const swiftDev = path.join(installation, 'Swift-development', 'bin')
    const icu67 = path.join(installation, 'icu-67', 'usr', 'bin')
    const runtime = path.join(
      installation,
      'swift',
      'runtime-development',
      'usr',
      'bin'
    )
    const requirePaths = [swiftPath, swiftDev, icu67]
    try {
      await fs.access(runtime)
      requirePaths.push(runtime)
    } catch (error) {
      core.debug('No Swift runtime found, skipping runtime path')
    }

    for (const envPath of requirePaths) {
      core.debug(`Adding "${envPath}" to PATH`)
      core.addPath(envPath)
    }
    const pwshScript = `
    foreach ($level in "Machine", "User") {
      [Environment]::GetEnvironmentVariables($level).GetEnumerator() | % {
        # For Path variables, append the new values, if they're not already in there
        if ($_.Name -Match 'Path$') {
          Write-Output "Env:$($_.Name), value$($_.Value)"
        }
      }
    }
    `
    await exec ('pwsh', ['--command', pwshScript])
    core.debug(`Swift installed at "${swiftPath}"`)
    if (!this.visualStudio) {
      throw new Error('No supported Visual Studio installation in installer')
    }
    if (this.version && semver.lt(this.version, '5.4.2')) {
      await setupSupportFiles(this.visualStudio)
    }
    const swiftFlags = `-sdk %SDKROOT% -I %SDKROOT%/usr/lib/swift -L %SDKROOT%/usr/lib/swift/windows`
    core.exportVariable('SWIFTFLAGS', swiftFlags)
  }
}
