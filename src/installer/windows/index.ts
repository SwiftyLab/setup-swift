import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import * as semver from 'semver'
import {VerifyingToolchainInstaller} from '../verify'
import {WindowsToolchainSnapshot} from '../../snapshot'
import {VisualStudio, VISUAL_STUDIO_WINSDK_COMPONENT_REGEX} from '../../utils'
import {program86} from '../../utils/windows'
import {Installation, CustomInstallation} from './installation'

export class WindowsToolchainInstaller extends VerifyingToolchainInstaller<WindowsToolchainSnapshot> {
  private async winsdk() {
    const win11Semver = '10.0.22000'
    const recommended = semver.gte(this.version ?? '6.2.0', '6.2.0')
      ? win11Semver
      : '10.0.17763'
    const current = os.release()
    let version = semver.gte(current, recommended) ? current : recommended
    const insatlled = await this.insatlledSdks()
    if (insatlled.length && !insatlled.includes(version)) {
      version = insatlled[0]
    }

    const major = semver.lt(version, win11Semver) ? semver.major(version) : 11
    const minor = semver.patch(version)
    return `Microsoft.VisualStudio.Component.Windows${major}SDK.${minor}`
  }

  private async insatlledSdks() {
    const sdksPath = path.join(program86(), 'Windows Kits', '10', 'Include')
    try {
      const dirs = await fs.readdir(sdksPath, {withFileTypes: true})
      return dirs
        .filter(dirent => dirent.isDirectory())
        .map(dirent => {
          const parts = dirent.name.split('.')
          return parts.length >= 3 ? parts.slice(0, 3).join('.') : dirent.name
        })
        .filter(version => semver.valid(version))
        .sort(semver.rcompare)
    } catch (error) {
      core.warning(`Unable to get installed SDKs due to: "${error}"`)
      return []
    }
  }

  private async vsRequirement(arch: string) {
    const componentsStr = core.getInput('visual-studio-components')
    const providedComponents = componentsStr ? componentsStr.split(';') : []
    const winsdkComponent = providedComponents.find(component => {
      return (
        (VISUAL_STUDIO_WINSDK_COMPONENT_REGEX.exec(component)?.length ?? 0) > 1
      )
    })

    let compArch: string
    switch (arch) {
      case 'arm64':
      case 'arm':
      case 'arm64ec':
        compArch = arch.toUpperCase()
        break
      default:
        compArch = 'x86.x64'
        break
    }

    const vsComponents = [
      `Microsoft.VisualStudio.Component.VC.Tools.${compArch}`,
      ...providedComponents
    ]
    if (!winsdkComponent) {
      vsComponents.push(await this.winsdk())
    }
    return {
      version: '16',
      swift: this.version,
      components: vsComponents
    }
  }

  protected async download(arch: string) {
    core.debug(
      `Using VS requirement ${JSON.stringify(this.vsRequirement(arch))}`
    )
    const [, toolchain] = await Promise.all([
      VisualStudio.setup(await this.vsRequirement(arch)),
      super.download(arch)
    ])
    const exeFile = `${toolchain}.exe`
    await fs.rename(toolchain, exeFile)
    core.debug(`Toolchain installer downloaded at "${exeFile}"`)
    return exeFile
  }

  protected async unpack(exe: string, arch: string) {
    core.debug(`Unpacking for architecture "${arch}"`)
    const installation = await Installation.install(exe)
    return installation instanceof Installation ? installation.location : ''
  }

  protected async add(installLocation: string, arch: string) {
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

    const visualStudio = await VisualStudio.setup(
      await this.vsRequirement(arch)
    )
    await visualStudio.update(sdkroot)
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
