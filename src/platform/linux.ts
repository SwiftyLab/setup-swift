import * as path from 'path'
import {promises as fs} from 'fs'
import {VersionedPlatform} from './versioned'
import {ToolchainVersion, SWIFT_BRANCH_REGEX} from '../version'
import {LinuxToolchainSnapshot} from '../snapshot'
import {LinuxToolchainInstaller} from '../installer'
import {MODULE_DIR} from '../const'

export class LinuxPlatform extends VersionedPlatform<LinuxToolchainInstaller> {
  protected get downloadExtension() {
    return 'tar.gz'
  }

  private async html() {
    const doc = path.join(MODULE_DIR, 'swiftorg', 'download', 'index.md')
    const content = await fs.readFile(doc, 'utf8')
    return content
  }

  async tools(version: ToolchainVersion) {
    let html: string
    const tools = await super.tools(version)
    return await Promise.all(
      tools.map(async tool => {
        if (tool.docker) {
          return tool
        }
        let headingPattern: RegExp
        const match = SWIFT_BRANCH_REGEX.exec(tool.branch)
        if (match && match.length > 1) {
          const ver = match[1]
          headingPattern = new RegExp(`Swift ${ver}`, 'g')
          if (
            tools.some(newTool => newTool.branch.match(`swift-${ver}-release`))
          ) {
            return tool
          }
          if (
            tools.some(
              newTool =>
                newTool.branch === tool.branch && newTool.date > tool.date
            )
          ) {
            return tool
          }
        } else {
          headingPattern = /(Trunk Development|\(main\))/g
        }

        if (!html) {
          html = await this.html()
        }
        if (!headingPattern.exec(html)) {
          return tool
        }
        const platformPattern = new RegExp(
          `{(?!.*{).*platform_dir="${tool.platform}".*}`,
          'g'
        )
        platformPattern.lastIndex = headingPattern.lastIndex
        const toolMetaMatch = platformPattern.exec(html)
        if (!toolMetaMatch?.length) {
          return tool
        }

        const dockerMatch = /docker_tag=("|')((?<!\\)\\\1|.)*?\1/.exec(
          toolMetaMatch[0]
        )
        if (!dockerMatch || dockerMatch.length < 3) {
          return tool
        }

        return {...tool, docker: dockerMatch[2]}
      })
    )
  }

  async install(data: LinuxToolchainSnapshot) {
    const installer = new LinuxToolchainInstaller(data)
    await installer.install(this.arch)
    return installer
  }
}
