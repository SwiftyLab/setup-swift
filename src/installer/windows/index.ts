import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {exec, getExecOutput} from '@actions/exec'
import * as semver from 'semver'
import {VerifyingToolchainInstaller} from '../verify'
import {WindowsToolchainSnapshot} from '../../snapshot'
import {VisualStudio} from '../../utils'
import {Installation} from './installation'

export class WindowsToolchainInstaller extends VerifyingToolchainInstaller<WindowsToolchainSnapshot> {
  private get vsRequirement() {
    const reccommended = '10.0.17763'
    const current = os.release()
    const version = semver.gte(current, reccommended) ? current : reccommended
    const winsdk = semver.patch(version)
    const componentsStr = core.getInput('visual-studio-components')
    const providedComponents = componentsStr ? componentsStr.split(';') : []
    return {
      version: '16',
      components: [
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        `Microsoft.VisualStudio.Component.Windows10SDK.${winsdk}`,
        ...providedComponents
      ]
    }
  }

  protected async download() {
    core.debug(`Using VS requirement ${JSON.stringify(this.vsRequirement)}`)
    const [, toolchain] = await Promise.all([
      VisualStudio.setup(this.vsRequirement),
      super.download()
    ])
    const exeFile = `${toolchain}.exe`
    await fs.rename(toolchain, exeFile)
    core.debug(`Toolchain installer downloaded at "${exeFile}"`)
    return exeFile
  }

  protected async unpack(exe: string) {
    async function env() {
      const {stdout} = await getExecOutput('cmd', ['/c', 'set'], {
        failOnStdErr: true
      })
      return stdout
    }
    core.debug(`Installing toolchain from "${exe}"`)
    core.debug(`Environment variables before installation: ${await env()}`)
    await exec(`"${exe}"`, ['-q'])
    core.debug(`Environment variables after installation: ${await env()}`)
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
      try {
        await fs.access(envPath)
        core.debug(`Adding "${envPath}" to PATH`)
        core.addPath(envPath)
      } catch {
        core.debug(`"${envPath}" doesn't exist. Skip adding to PATH`)
      }
    }
    core.debug(`Swift installed at "${swiftPath}"`)
    const visualStudio = await VisualStudio.setup(this.vsRequirement)
    await visualStudio.update(installation.sdkroot)
    const swiftFlags = `-sdk %SDKROOT% -I %SDKROOT%/usr/lib/swift -L %SDKROOT%/usr/lib/swift/windows`
    core.exportVariable('SWIFTFLAGS', swiftFlags)
  }
}
