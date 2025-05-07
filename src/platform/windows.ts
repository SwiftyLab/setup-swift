import {VersionedPlatform} from './versioned'
import {WindowsToolchainInstaller} from '../installer'
import {WindowsToolchainSnapshot, ToolchainSnapshot} from '../snapshot'

export class WindowsPlatform extends VersionedPlatform<WindowsToolchainInstaller> {
  constructor(
    readonly name: string,
    readonly version: number,
    readonly arch: string
  ) {
    switch (arch) {
      case 'x64':
        arch = 'x86_64'
        break
      default:
        break
    }
    super(name, version, arch)
  }

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
