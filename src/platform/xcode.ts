import * as path from 'path'
import {promises as fs} from 'fs'
import * as marked from 'marked'
import {JSDOM} from 'jsdom'
import {Platform} from './base'
import {ToolchainVersion} from '../version'
import {XcodeToolchainSnapshot} from '../snapshot'
import {XcodeToolchainInstaller} from '../installer'
import {MODULE_DIR} from '../const'

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

  // eslint-disable-next-line no-undef
  private extractDate(element: HTMLHeadElement) {
    let nextElement = element.nextElementSibling
    while (nextElement) {
      if (
        nextElement.nodeName === 'TABLE' &&
        nextElement.className === 'downloads'
      ) {
        const times = nextElement.getElementsByTagName('time')
        if (times.length && times[0].textContent) {
          return new Date(times[0].textContent)
        }
        break
      }

      const match = nextElement.textContent?.match(/Date: (.*)/)
      if (match && match.length > 1) {
        return new Date(match[1])
      }

      nextElement = nextElement.nextElementSibling
    }
  }

  // eslint-disable-next-line no-undef
  private extractDir(element: HTMLHeadElement) {
    const header = element.textContent
    let nextElement = element.nextElementSibling
    while (nextElement) {
      if (
        nextElement.nodeName === 'TABLE' &&
        nextElement.className === 'downloads'
      ) {
        for (const tag of nextElement.getElementsByTagName('a')) {
          switch (String(tag.parentElement?.className)) {
            case 'download': {
              const comps = tag.href.trim().split('/')
              if (comps.length > 1) {
                return comps[comps.length - 2]
              }
              break
            }
            default:
              break
          }
        }
        break
      }

      if (!nextElement.textContent?.match(/Tag: .*/)) {
        nextElement = nextElement.nextElementSibling
        continue
      }

      const tags = nextElement.getElementsByTagName('a')
      if (tags.length) {
        return tags[0].textContent?.trim()
      }

      while (nextElement) {
        if (
          nextElement.nodeName === 'TABLE' &&
          nextElement.className === 'downloads'
        ) {
          break
        }

        if (nextElement.nodeName === 'A') {
          return nextElement.textContent?.trim()
        }

        nextElement = nextElement.nextElementSibling
      }
      break
    }

    if (!header) {
      return
    }
    return `${header.toLowerCase().replaceAll(' ', '-')}-RELEASE`
  }

  // eslint-disable-next-line no-undef
  private extractToolUsageData(element: HTMLHeadElement) {
    let xcode: string | undefined
    let download: string | undefined
    let symbols: string | undefined

    let nextElement = element.nextElementSibling
    while (nextElement) {
      if (
        nextElement.nodeName === 'TABLE' &&
        nextElement.className === 'downloads'
      ) {
        break
      }
      nextElement = nextElement.nextElementSibling
    }

    for (const tag of nextElement?.getElementsByTagName('a') ?? []) {
      switch (String(tag.parentElement?.className)) {
        case 'release': {
          // Extract Xcode data
          const match = tag.textContent?.trim().match(/Xcode\s+(.*)/)
          if (match && match.length > 1) {
            xcode = match[1]
          }
          break
        }
        case 'download': {
          // Extract download data
          const resource = tag.href.trim().split('/').pop()
          if (
            tag.className === 'signature' ||
            tag.title === 'Debugging Symbols'
          ) {
            symbols = resource
          } else {
            download = resource
          }
          break
        }
        default:
          break
      }
    }
    return {xcode, download, symbols}
  }

  private async stableBuildData(version: ToolchainVersion) {
    const data: XcodeToolchainSnapshot[] = []
    const docs = [
      path.join(MODULE_DIR, 'swiftorg', 'download', 'index.md'),
      path.join(MODULE_DIR, 'swiftorg', 'download', '_older-releases.md')
    ]
    for (const doc of docs) {
      const content = await fs.readFile(doc, 'utf8')
      const dom = new JSDOM(marked.parse(content))
      for (const element of dom.window.document.querySelectorAll('h3')) {
        if (!element.textContent?.match(/Swift .*/)) {
          continue
        }

        const header = element.textContent
        const date = this.extractDate(element)
        const dir = this.extractDir(element)
        const {xcode, download, symbols} = this.extractToolUsageData(element)

        if (date && dir && version.satisfiedBy(dir) && (download || xcode)) {
          data.push({
            name: `Xcode ${header}`,
            date,
            download: download ?? `${dir}-osx.pkg`,
            symbols,
            dir,
            xcode,
            platform: this.name,
            branch: dir.toLocaleLowerCase()
          })
        }
      }
    }
    return data
  }

  async tools(version: ToolchainVersion) {
    const stableTools = await this.stableBuildData(version)
    if (!stableTools.length || version.dev) {
      const devTools = await super.tools(version)
      stableTools.push(...devTools)
    }
    return stableTools.sort(
      (item1, item2) => item2.date.getTime() - item1.date.getTime()
    )
  }

  async install(data: XcodeToolchainSnapshot) {
    const installer = new XcodeToolchainInstaller(data)
    await installer.install(this.arch)
    return installer
  }
}
