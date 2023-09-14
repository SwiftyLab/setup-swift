import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import {ToolchainVersion} from '../version'
import {ToolchainSnapshot, SwiftRelease} from '../snapshot'
import {ToolchainInstaller, SnapshotForInstaller} from '../installer'
import {MODULE_DIR} from '../const'

const RELEASE_FILE = path.join(
  MODULE_DIR,
  'swiftorg',
  '_data',
  'builds',
  'swift_releases.yml'
)

export abstract class Platform<
  Installer extends ToolchainInstaller<SnapshotForInstaller<Installer>>
> {
  abstract readonly name: string
  abstract readonly arch: string
  abstract readonly file: string
  protected abstract readonly fileGlob: string

  protected async toolFiles(version: ToolchainVersion) {
    return await version.toolFiles(this.fileGlob)
  }

  protected async releases() {
    const data = await fs.readFile(RELEASE_FILE, 'utf-8')
    return yaml.load(data) as SwiftRelease[]
  }

  protected abstract releasedTools(
    version: ToolchainVersion
  ): Promise<SnapshotForInstaller<Installer>[]>

  async tools(
    version: ToolchainVersion
  ): Promise<SnapshotForInstaller<Installer>[]> {
    const snapshots = await this.releasedTools(version)
    if (snapshots.length && !version.dev) {
      return snapshots.sort(
        (item1, item2) =>
          (item2 as ToolchainSnapshot).date.getTime() -
          (item1 as ToolchainSnapshot).date.getTime()
      )
    }
    const files = await this.toolFiles(version)
    core.debug(`Using files "${files}" to get toolchains snapshot data`)

    const snapshotsCollection = await Promise.all(
      files.map(async file => {
        const ext = path.extname(file)
        const platform = path.basename(file, ext)
        const branch = path.basename(path.dirname(file)).replaceAll('_', '.')
        const data = await fs.readFile(file, 'utf-8')
        return {
          data: yaml.load(data) as object[],
          platform,
          branch
        }
      })
    )

    const devSnapshots = snapshotsCollection
      .flatMap(collection => {
        return collection.data.map(data => {
          return {
            ...data,
            platform: collection.platform,
            branch: collection.branch
          } as SnapshotForInstaller<Installer>
        })
      })
      .filter(item => version.satisfiedBy((item as ToolchainSnapshot).dir))
    snapshots.push(...devSnapshots)
    return snapshots.sort(
      (item1, item2) =>
        (item2 as ToolchainSnapshot).date.getTime() -
        (item1 as ToolchainSnapshot).date.getTime()
    )
  }

  abstract install(
    toolchain: SnapshotForInstaller<Installer>
  ): Promise<Installer>
}
