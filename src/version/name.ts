import {coerce as parseSemVer} from 'semver'
import {escapeRegExp} from 'lodash'
import {ToolchainVersion} from './base'

export const DEVELOPMENT_SNAPSHOT = 'DEVELOPMENT-SNAPSHOT'
export const SWIFT_BRANCH_REGEX = /swift-([^-]*)-.*/

export class ToolchainSnapshotName extends ToolchainVersion {
  constructor(readonly name: string) {
    super(name.includes(DEVELOPMENT_SNAPSHOT))
  }

  private get dir() {
    if (this.name.startsWith('swift-')) {
      return this.name
    }
    return `swift-${this.name}`
  }

  private get version() {
    const match = SWIFT_BRANCH_REGEX.exec(this.dir)
    if (!match || match.length < 2 || !parseSemVer(match[1])) {
      return
    }
    return match[1]
  }

  protected get dirGlob() {
    if (!this.version) {
      return '*'
    }
    return `swift-${this.version.replaceAll('.', '_')}-*`
  }

  protected get dirRegex() {
    return new RegExp(escapeRegExp(this.dir))
  }

  toString() {
    return this.dir
  }
}
