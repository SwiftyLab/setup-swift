import * as path from 'path'
import {Platform} from './base'
import {ToolchainVersion} from '../version'
import {XcodeToolchainSnapshot, ToolchainSnapshot} from '../snapshot'
import {XcodeToolchainInstaller} from '../installer'

export class XcodePlatform extends Platform<XcodeToolchainInstaller> {
  constructor(readonly arch: string) {
    switch (arch) {
      case 'x64':
        arch = 'x86_64'
        break
      case 'arm64':
        arch = 'aarch64'
        break
      default:
        break
    }
    super()
  }

  get name() {
    return 'xcode'
  }
  get file() {
    return this.name
  }
  protected get fileGlob() {
    return this.name
  }

  snapshotFor(snapshot: ToolchainSnapshot) {
    const fileExt = path.extname(snapshot.download)
    const fileName = path.basename(snapshot.download, fileExt)
    return {
      ...snapshot,
      debug_info: `${fileName}-symbols.${fileExt}`
    }
  }

  protected async releasedTools(version: ToolchainVersion) {
    const releases = await this.releases()
    return releases
      .filter(release => version.satisfiedBy(release))
      .map(release => {
        const xMatch = /Xcode\s+(.*)/.exec(release.xcode)
        return {
          name: `Xcode Swift ${release.name}`,
          date: release.date,
          download: `${release.tag}-osx.pkg`,
          debug_info: `${release.tag}-osx-symbols.pkg`,
          dir: release.tag,
          xcode: xMatch && xMatch.length > 1 ? xMatch[1] : undefined,
          platform: this.name,
          branch: release.tag.toLocaleLowerCase(),
          preventCaching: false
        } as XcodeToolchainSnapshot
      })
  }

  async install(data: XcodeToolchainSnapshot) {
    const installer = new XcodeToolchainInstaller(data)
    await installer.install(this.arch)
    return installer
  }
}
