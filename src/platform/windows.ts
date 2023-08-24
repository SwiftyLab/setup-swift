import {VersionedPlatform} from './versioned'
import {WindowsToolchainInstaller} from '../installer'
import {WindowsToolchainSnapshot} from '../snapshot'

export class WindowsPlatform extends VersionedPlatform<WindowsToolchainInstaller> {
  async install(data: WindowsToolchainSnapshot) {
    const installer = new WindowsToolchainInstaller(data)
    await installer.install(this.name, this.arch)
    return installer
  }
}
