import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import * as semver from 'semver'
import {VerifyingToolchainInstaller} from '../verify'
import {WindowsToolchainSnapshot} from '../../snapshot'
import {VisualStudio} from '../../utils'
import {Installation, CustomInstallation} from './installation'

export class WindowsToolchainInstaller extends VerifyingToolchainInstaller<WindowsToolchainSnapshot> {
  private get winsdk() {
    const recommended = '10.0.17763'
    const win11Semver = '10.0.22000'
    const current = os.release()
    const version = semver.gte(current, recommended) ? current : recommended
    const major = semver.lt(version, win11Semver) ? semver.major(version) : 11
    const minor = semver.patch(version)
    return `Microsoft.VisualStudio.Component.Windows${major}SDK.${minor}`
  }

  private get vsRequirement() {
    const componentsStr = core.getInput('visual-studio-components')
    const providedComponents = componentsStr ? componentsStr.split(';') : []
    return {
      version: '16',
      swift: this.version,
      components: [
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        this.winsdk,
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
    const installation = await Installation.install(exe)
    return installation instanceof Installation ? installation.location : ''
  }

  protected async add(installLocation: string) {
    const installation = await Installation.get(installLocation)
    const sdkrootKey = 'SDKROOT'
    let sdkroot: string | undefined
    if (installation instanceof Installation) {
      sdkroot = installation?.sdkroot ?? core
      core.exportVariable(sdkrootKey, sdkroot)
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
    } else if (installation instanceof CustomInstallation) {
      sdkroot = installation.variables[sdkrootKey]
    }

    if (!sdkroot) {
      core.warning(`Failed VS enviroment after installation ${installLocation}`)
      return
    }

    const visualStudio = await VisualStudio.setup(this.vsRequirement)
    await visualStudio.update(
      sdkroot,
      !this.version || semver.lt(this.version, '6.0.0')
    )
    const swiftFlags = [
      '-sdk',
      sdkroot,
      '-I',
      path.join(sdkroot, 'usr', 'lib', 'swift'),
      '-L',
      path.join(sdkroot, 'usr', 'lib', 'swift', 'windows')
    ].join(' ')
    core.exportVariable('SWIFTFLAGS', swiftFlags)
  }
}
