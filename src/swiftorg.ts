import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {MODULE_DIR} from './const'

const SWIFTORG = 'swiftorg'

export class Swiftorg {
  readonly checkLatest: boolean

  constructor(checkLatest: boolean) {
    this.checkLatest = checkLatest
  }

  private async addSwiftorgSubmodule() {
    const swiftorg = path.join(MODULE_DIR, SWIFTORG)
    try {
      await fs.access(swiftorg)
      core.debug(`Removing existing "${swiftorg}" directory`)
      await fs.rmdir(swiftorg, {recursive: true})
    } catch (error) {
      core.debug(`Failed removing "${swiftorg}" with "${error}"`)
    }
    core.debug(`Adding submodule at "${swiftorg}" directory`)
    await exec(
      'git',
      [
        'submodule',
        'add',
        'https://github.com/apple/swift-org-website.git',
        SWIFTORG
      ],
      {cwd: MODULE_DIR}
    )
    if (this.checkLatest) {
      core.debug(`Skipping switching to tracked commit`)
      return
    }
    const packagePath = path.join(MODULE_DIR, 'package.json')
    const packageContent = await fs.readFile(packagePath, 'utf-8')
    const commit = (JSON.parse(packageContent) as {swiftorg?: string}).swiftorg
    if (!commit) {
      core.debug(`No commit tracked in "${packageContent}, skipping switching`)
      return
    }
    core.debug(`Switching to commit "${commit}`)
    await exec('git', ['checkout', commit], {cwd: swiftorg})
  }

  async update() {
    const gitArgs = ['submodule', 'update']
    if (this.checkLatest) {
      gitArgs.push('--init', '--recursive', '--remote', '--merge')
    }
    core.debug(`Initializing submodules in "${MODULE_DIR}"`)
    await exec('git', ['init'], {cwd: MODULE_DIR})
    await exec('git', ['submodule', 'init'], {cwd: MODULE_DIR})
    core.debug(`Updating submodules in "${MODULE_DIR}" with args "${gitArgs}"`)
    await exec('git', gitArgs, {cwd: MODULE_DIR})
    const swiftorg = path.join(MODULE_DIR, 'swiftorg')
    try {
      await fs.access(swiftorg)
      const files = await fs.readdir(swiftorg)
      if (!files.length) {
        core.debug(`No files in "${swiftorg}", adding submodule`)
        await this.addSwiftorgSubmodule()
      }
    } catch (error) {
      core.debug(`"${swiftorg}" directory does not exist, adding submodule`)
      await this.addSwiftorgSubmodule()
    }
  }
}
