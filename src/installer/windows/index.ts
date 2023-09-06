import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {VerifyingToolchainInstaller} from '../verify'
import {WindowsToolchainSnapshot} from '../../snapshot'
import {setupVisualStudioTools, setupSupportFiles} from '../../utils'
import {Installation} from './installation'

export class WindowsToolchainInstaller extends VerifyingToolchainInstaller<WindowsToolchainSnapshot> {
  private readonly vsRequirement = {
    version: '16',
    components: [
      'Microsoft.VisualStudio.Component.VC.ATL',
      'Microsoft.VisualStudio.Component.VC.CMake.Project',
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      'Microsoft.VisualStudio.Component.Windows10SDK'
    ]
  }

  protected async download() {
    core.debug(`Using Visual Studio requirement ${this.vsRequirement}`)
    const [, toolchain] = await Promise.all([
      setupVisualStudioTools(this.vsRequirement),
      super.download()
    ])
    const exeFile = `${toolchain}.exe`
    await fs.rename(toolchain, exeFile)
    core.debug(`Toolchain installer downloaded at "${exeFile}"`)
    return exeFile
  }

  protected async unpack(exe: string) {
    core.debug(`Installing toolchain from "${exe}"`)
    await exec(`"${exe}"`, ['-q'])
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
    const visualStudio = await setupVisualStudioTools(this.vsRequirement)
    await setupSupportFiles(visualStudio, installation.sdkroot)
    const swiftFlags = `-sdk %SDKROOT% -I %SDKROOT%/usr/lib/swift -L %SDKROOT%/usr/lib/swift/windows`
    core.exportVariable('SWIFTFLAGS', swiftFlags)
  }
}
