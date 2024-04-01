import {URL} from 'url'
import {posix} from 'path'
import {ToolchainVersion} from './base'

export class ToolchainSnapshotLocation extends ToolchainVersion {
  constructor(
    readonly url: URL,
    dev: boolean
  ) {
    super(dev)
  }

  protected get dirGlob() {
    return ''
  }

  protected get dirRegex() {
    return /a^/
  }

  get requiresSwiftOrg() {
    return false
  }

  toolchainSnapshot(platform: string) {
    try {
      const baseUrl = posix.dirname(this.url.href)
      return {
        name: 'Swift Custom Snapshot',
        date: new Date(),
        download: posix.basename(this.url.href),
        dir: posix.basename(baseUrl),
        platform,
        branch: this.url.pathname.split(posix.sep)[1],
        baseUrl: new URL(baseUrl),
        preventCaching: true
      }
    } catch (e) {
      throw new Error(`Swift resource: "${this.url}" failed with error ${e}`)
    }
  }

  toString() {
    return `url: "${this.url}", dev: ${this.dev}`
  }
}
