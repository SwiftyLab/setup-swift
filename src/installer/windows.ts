import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
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
    const vsRequirement: VisualStudioRequirement = {
      version: '16',
      components: [
        'Microsoft.VisualStudio.Component.VC.ATL',
        'Microsoft.VisualStudio.Component.VC.CMake.Project',
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        'Microsoft.VisualStudio.Component.Windows10SDK'
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
    const installation = await Installation.detect()
    return installation.location
  }

  protected async add(installLocation: string) {
    const installation = await Installation.get(installLocation)
    core.exportVariable('SDKROOT', installation.sdkroot)
    if (installation.devdir) {
      core.exportVariable('DEVELOPER_DIR', installation.devdir)
    }
    const location = installation.location
    const swiftPath = path.join(installation.toolchain, 'usr', 'bin')
    const swiftDev = path.join(location, 'Swift-development', 'bin')
    const icu67 = path.join(location, 'icu-67', 'usr', 'bin')
    const tools = path.join(location, 'Tools')
    const runtimePath = path.join(installation.runtime, 'usr', 'bin')
    const requirePaths = [swiftPath, swiftDev, icu67, tools, runtimePath]

    for (const envPath of requirePaths) {
      core.debug(`Adding "${envPath}" to PATH`)
      core.addPath(envPath)
    }
    core.debug(`Swift installed at "${swiftPath}"`)
    if (!this.visualStudio) {
      throw new Error('No supported Visual Studio installation in installer')
    }
    await setupSupportFiles(this.visualStudio, installation.sdkroot)
    const swiftFlags = `-sdk %SDKROOT% -I %SDKROOT%/usr/lib/swift -L %SDKROOT%/usr/lib/swift/windows`
    core.exportVariable('SWIFTFLAGS', swiftFlags)
  }
}

class Installation {
  readonly location: string
  readonly toolchain: string
  readonly sdkroot: string
  readonly runtime: string
  readonly devdir?: string

  private constructor(
    location: string,
    toolchain: string,
    sdkroot: string,
    runtime: string,
    devdir?: string
  ) {
    this.location = location
    this.toolchain = toolchain
    this.sdkroot = sdkroot
    this.runtime = runtime
    this.devdir = devdir
  }

  static async get(location: string, fallback?: string) {
    let toolchain: string
    let sdkroot: string
    let runtime: string
    let devdir: string | undefined

    try {
      core.debug(`Checking for development snapshot installation`)
      toolchain = path.join(location, 'Toolchains', '0.0.0+Asserts')
      sdkroot = path.join(
        location,
        'Platforms',
        'Windows.platform',
        'Developer',
        'SDKs',
        'Windows.sdk'
      )
      runtime = path.join(location, 'Runtimes', '0.0.0')
      await fs.access(toolchain)
    } catch (error) {
      core.debug(`Switching to default installation due to "${error}"`)
      if (fallback) {
        location = fallback
      }
      devdir = path.join(location, 'Developer')
      toolchain = path.join(
        devdir,
        'Toolchains',
        'unknown-Asserts-development.xctoolchain'
      )
      sdkroot = path.join(
        devdir,
        'Platforms',
        'Windows.platform',
        'Developer',
        'SDKs',
        'Windows.sdk'
      )
      runtime = path.join(location, 'Swift', 'runtime-development')
    }
    return new Installation(location, toolchain, sdkroot, runtime, devdir)
  }

  static async detect() {
    const systemDrive = process.env.SystemDrive ?? 'C:'
    const defaultPath = path.join(systemDrive, 'Library')
    const devPath = path.join(systemDrive, 'Program Files', 'Swift')
    const installation = await Installation.get(devPath, defaultPath)
    if (path.relative(devPath, installation.location)) {
      const runtimeRoot = path.join(installation.location, 'Swift')
      try {
        await fs.access(devPath)
        await fs.cp(devPath, runtimeRoot, {recursive: true})
      } catch (error) {
        core.debug(`Runtime check failed with "${error}"`)
      }
    }
    core.debug(`Installation location at "${installation.location}"`)
    core.debug(`Toolchain installed at "${installation.toolchain}"`)
    core.debug(`SDK installed at "${installation.sdkroot}"`)
    core.debug(`Runtime installed at "${installation.runtime}"`)
    core.debug(`Development directory at "${installation.devdir}"`)
    return installation
  }
}
