import * as path from 'path'
import * as core from '@actions/core'
import {glob} from 'glob'
import {MODULE_DIR} from '../const'

export const SWIFT_RELEASE_REGEX = /swift-(.*)-release/

export abstract class ToolchainVersion {
  protected abstract readonly dirGlob: string
  protected abstract readonly dirRegex: RegExp

  constructor(readonly dev: boolean) {}

  async toolFiles(fileGlob: string) {
    const pattern = `swiftorg/_data/builds/${this.dirGlob}/${fileGlob}.yml`
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

  satisfiedBy(dir: string) {
    return this.dirRegex.exec(dir)
  }
}
