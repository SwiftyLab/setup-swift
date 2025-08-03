import {URL} from 'url'
import * as core from '@actions/core'
import {SemVer, coerce as parseSemVer} from 'semver'
import {ToolchainVersion} from './base'
import {LatestToolchainVersion} from './latest'
import {SemanticToolchainVersion} from './semver'
import {ToolchainSnapshotName, DEVELOPMENT_SNAPSHOT} from './name'
import {ToolchainSnapshotLocation} from './location'
import {SdkSupportedVersion} from './sdk'

declare module './base' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace ToolchainVersion {
    function create(
      requested: string,
      dev: boolean,
      sdks?: string[]
    ): ToolchainVersion
  }
}

ToolchainVersion.create = (requested: string, dev = false, sdks?: string[]) => {
  let baseVersion: ToolchainVersion

  try {
    const toolchainUrl = new URL(requested)
    baseVersion = new ToolchainSnapshotLocation(toolchainUrl, dev)
  } catch {
    core.debug(`Input "${requested}" not an URL`)

    if (requested === 'latest' || requested === 'current') {
      core.debug(
        `Using latest ${dev ? 'development ' : ''}toolchain requirement`
      )
      baseVersion = new LatestToolchainVersion(dev)
    } else if (
      requested.includes(DEVELOPMENT_SNAPSHOT) ||
      requested.startsWith('swift-')
    ) {
      const version = new ToolchainSnapshotName(requested)
      core.debug(`Using as toolchain name "${version}"`)
      baseVersion = version
    } else {
      let semver: SemVer
      try {
        semver = new SemVer(requested)
      } catch (error) {
        const ver = parseSemVer(requested)
        if (!ver) {
          throw error
        }
        semver = ver
      }
      core.debug(
        `Using latest ${requested}${dev ? '-dev' : ''} toolchain requirement`
      )
      baseVersion = new SemanticToolchainVersion(requested, semver, dev)
    }
  }

  // If SDKs are requested, wrap the base version with SdkSupportedVersion
  if (sdks && sdks.length > 0) {
    const filteredSdks = sdks.filter(sdk => sdk.trim().length > 0)
    if (filteredSdks.length > 0) {
      core.debug(
        `Wrapping version with SDK support for: ${filteredSdks.join(', ')}`
      )
      return new SdkSupportedVersion(baseVersion, filteredSdks, dev)
    }
  }

  return baseVersion
}

export * from './base'
export * from './latest'
export * from './semver'
export * from './name'
export * from './location'
export * from './sdk'
