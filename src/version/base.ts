import * as path from 'path'
import * as core from '@actions/core'
import {glob} from 'glob'
import {MODULE_DIR} from '../const'
import {ToolchainSnapshot, SwiftRelease, SdkSnapshot} from '../snapshot'

export const SWIFT_BUILDS_DIR = path.join(
  MODULE_DIR,
  'swiftorg',
  '_data',
  'builds'
)
export const SWIFT_RELEASE_FILE = path.join(
  SWIFT_BUILDS_DIR,
  'swift_releases.yml'
)
export const SWIFT_RELEASE_REGEX = /swift-(.*)-release/

export abstract class ToolchainVersion {
  protected abstract readonly dirGlob: string
  protected abstract readonly dirRegex: RegExp

  get requiresSwiftOrg() {
    return true
  }

  constructor(readonly dev: boolean) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toolchainSnapshot(platform: string): ToolchainSnapshot | undefined {
    return undefined
  }

  async toolFiles(fileGlob: string) {
    const pattern = path.posix.join(
      SWIFT_BUILDS_DIR,
      this.dirGlob,
      `${fileGlob}.yml`
    )
    core.debug(`Searching for glob "${pattern}"`)
    let files = await glob(pattern, {absolute: true, cwd: MODULE_DIR})
    core.debug(`Retrieved files "${files}" for glob "${pattern}"`)
    if (!this.dev) {
      const stableFiles = files.filter(file => {
        return SWIFT_RELEASE_REGEX.exec(path.basename(path.dirname(file)))
      })
      if (stableFiles.length) {
        files = stableFiles
      }
    }
    return files
  }

  satisfiedBy(release: SwiftRelease | string) {
    const tag = typeof release === 'string' ? release : release.tag
    return this.dirRegex.exec(tag) != null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sdkSnapshots(toolchain: ToolchainSnapshot): Promise<SdkSnapshot[]> {
    core.info('No SDKs to install')
    return []
  }
}
