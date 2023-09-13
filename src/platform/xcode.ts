import {Platform} from './base'
import {ToolchainVersion} from '../version'
import {XcodeToolchainSnapshot} from '../snapshot'
import {XcodeToolchainInstaller} from '../installer'

export class XcodePlatform extends Platform<XcodeToolchainInstaller> {
  constructor(readonly arch: string) {
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

  protected async releasedTools(version: ToolchainVersion) {
    const releases = await this.releases()
    return releases
      .filter(release => version.satisfiedBy(release.tag))
      .map(release => {
        const xMatch = /Xcode\s+(.*)/.exec(release.xcode)
        return {
          name: `Xcode Swift ${release.name}`,
          date: release.date,
          download: `${release.tag}-osx.pkg`,
          symbols: `${release.tag}-osx-symbols.pkg`,
          dir: release.tag,
          xcode: xMatch && xMatch.length > 1 ? xMatch[1] : undefined,
          platform: this.name,
          branch: release.tag.toLocaleLowerCase()
        } as XcodeToolchainSnapshot
      })
  }

  async install(data: XcodeToolchainSnapshot) {
    const installer = new XcodeToolchainInstaller(data)
    await installer.install(this.arch)
    return installer
  }
}
