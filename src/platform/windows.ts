import {VersionedPlatform} from './versioned'
import {WindowsToolchainInstaller} from '../installer'
import {WindowsToolchainSnapshot, ToolchainSnapshot} from '../snapshot'

export class WindowsPlatform extends VersionedPlatform<WindowsToolchainInstaller> {
  protected get downloadExtension() {
    return 'exe'
  }

  snapshotFor(snapshot: ToolchainSnapshot) {
    return {
      ...snapshot,
      download_signature: `${snapshot.download}.sig`,
      windows: true
    }
  }

  async install(data: WindowsToolchainSnapshot) {
    const installer = new WindowsToolchainInstaller(data)
    await installer.install(this.arch)
    return installer
  }
}
