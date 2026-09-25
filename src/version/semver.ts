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

  /**
   * The version prefix every toolchain tag satisfying this request starts with,
   * e.g. `6.4` for both `6.4` and `6.4.0`, since swift.org drops a zero patch
   * component when tagging a release.
   */
  private get versionPrefix() {
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
    return version
  }

  /**
   * Whether an exact zero patch version was requested, i.e. the request spells
   * out a patch component that {@link versionPrefix} drops, and so must not be
   * satisfied by a later patch of the same minor version.
   */
  private get isExactZeroPatch() {
    return this.semver.patch === 0 && this.requested !== this.versionPrefix
  }

  protected get dirGlob() {
    return `swift-${this.versionPrefix.replaceAll('.', '_')}*`
  }

  protected get dirRegex() {
    const version = escapeRegExp(this.versionPrefix)
    if (this.isExactZeroPatch) {
      // swift.org tags an exact `x.y.0` release as `swift-x.y-RELEASE` up to
      // Swift 6.3 and as `swift-x.y.0-RELEASE` from Swift 6.4, with its
      // development snapshots tagged `swift-x.y.x-DEVELOPMENT-SNAPSHOT-*`
      return new RegExp(`swift-${version}(\\.(0|x))?-`)
    }
    return new RegExp(`swift-${version}`)
  }

  toString() {
    return `version: ${this.semver.raw}, dev: ${this.dev}`
  }
}
