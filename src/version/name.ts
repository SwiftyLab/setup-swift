import {coerce as parseSemVer} from 'semver'
import {ToolchainVersion} from './base'

export const DEVELOPMENT_SNAPSHOT = 'DEVELOPMENT-SNAPSHOT'

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

  protected get dirGlob() {
    const match = /swift-([^-]*)-/.exec(this.dir)
    if (!match || match.length < 2 || !parseSemVer(match[1])) {
      return '*'
    }
    return `swift-${match[1].replaceAll('.', '_')}-*`
  }

  protected get dirRegex() {
    return new RegExp(this.dir)
  }

  toString() {
    return this.dir
  }
}
