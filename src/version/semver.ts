import {SemVer} from 'semver'
import {escapeRegExp} from 'lodash'
import {ToolchainVersion} from './base'

export class SemanticToolchainVersion extends ToolchainVersion {
  constructor(
    readonly requested: string,
    readonly semver: SemVer,
    dev: boolean
  ) {
    super(dev)
  }

  private get versionComponent() {
    if (this.semver.patch !== 0) {
      return this.requested
    }

    let version = `${this.semver.major}`
    if (this.semver.minor || this.requested.includes('.')) {
      version += `.${this.semver.minor}`
    }
    if (this.semver.prerelease.length) {
      version += `-${this.semver.prerelease.join('.')}`
    }
    if (this.semver.build.length) {
      version += `+${this.semver.build.join('.')}`
    }
    return version === this.requested ? this.requested : `${version}-`
  }

  protected get dirGlob() {
    return `swift-${this.versionComponent.replaceAll('.', '_')}*`
  }

  protected get dirRegex() {
    return new RegExp(`swift-${escapeRegExp(this.versionComponent)}`)
  }

  toString() {
    return `version: ${this.semver.raw}, dev: ${this.dev}`
  }
}
