import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {MODULE_DIR} from './const'
import https from 'https'

const SWIFTORG = 'swiftorg'

export class Swiftorg {
  constructor(readonly checkLatest: boolean | string) {
    if (typeof checkLatest === 'string') {
      try {
        const checkLatestBool = JSON.parse(checkLatest)
        if (typeof checkLatestBool === 'boolean') {
          this.checkLatest = checkLatestBool
          return
        }
      } catch (error) {
        core.debug(`Parsing 'check-latest' failed with error: "${error}"`)
      }
    }
    this.checkLatest = checkLatest
  }

  private async swiftorgMetadata(): Promise<{commit?: string}> {
    if (process.env.SETUPSWIFT_SWIFTORG_METADATA) {
      return JSON.parse(process.env.SETUPSWIFT_SWIFTORG_METADATA)
    }
    return new Promise((resolve, reject) => {
      https.get(
        'https://swiftylab.github.io/setup-swift/metadata.json',
        res => {
          const {statusCode} = res
          const contentType = res.headers['content-type']

          let error
          if (statusCode !== 200) {
            error = new Error(`Request Failed Status Code: '${statusCode}'`)
          } else if (!contentType?.startsWith('application/json')) {
            error = new Error(`Invalid content-type: ${contentType}`)
          }

          if (error) {
            core.error(error.message)
            res.resume()
            reject(error)
            return
          }

          let rawData = ''
          res.setEncoding('utf8')
          res.on('data', chunk => {
            rawData += chunk
          })
          res.on('end', () => {
            try {
              const parsedData = JSON.parse(rawData)
              core.debug(`Recieved swift.org metadata: "${parsedData}"`)
              resolve(parsedData)
            } catch (e) {
              core.error(`Parsing swift.org metadata error: '${e}'`)
              reject(e)
            }
          })
        }
      )
    })
  }

  private async addSwiftorgSubmodule() {
    const swiftorg = path.join(MODULE_DIR, SWIFTORG)
    try {
      await fs.access(swiftorg)
      core.debug(`Removing existing "${swiftorg}" directory`)
      await fs.rm(swiftorg, {recursive: true})
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

    let ref: string | undefined
    if (typeof this.checkLatest === 'boolean' && this.checkLatest) {
      core.debug(`Skipping switching to tracked commit`)
      return
    } else if (typeof this.checkLatest === 'string') {
      ref = this.checkLatest
    } else {
      const swiftorgMetadata = await this.swiftorgMetadata()
      ref = swiftorgMetadata.commit
    }
    if (!ref) {
      core.debug(`No commit tracked, skipping switching`)
      return
    }
    core.debug(`Switching to commit "${ref}`)
    await exec('git', ['checkout', ref], {cwd: swiftorg})
  }

  async update() {
    const gitArgs = [
      'submodule',
      'update',
      '--init',
      '--checkout',
      '--recursive',
      '--remote'
    ]
    core.debug(`Initializing submodules in "${MODULE_DIR}"`)
    await exec('git', ['init', '-b', 'main'], {cwd: MODULE_DIR})
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
