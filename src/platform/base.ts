import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import semver from 'semver'
import {ToolchainVersion, SWIFT_BRANCH_REGEX} from '../version'
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

  private sortSnapshots(snapshots: SnapshotForInstaller<Installer>[]) {
    return snapshots.sort((item1, item2) => {
      const t1 = item1 as ToolchainSnapshot
      const t2 = item2 as ToolchainSnapshot
      const ver1 = semver.coerce(SWIFT_BRANCH_REGEX.exec(t1.branch)?.[0])
      const ver2 = semver.coerce(SWIFT_BRANCH_REGEX.exec(t2.branch)?.[0])
      if (ver1 && ver2) {
        const comparison = semver.compare(ver2, ver1)
        if (comparison !== 0) {
          return comparison
        }
      }
      return t2.date.getTime() - t1.date.getTime()
    })
  }

  protected abstract releasedTools(
    version: ToolchainVersion
  ): Promise<SnapshotForInstaller<Installer>[]>

  async tools(
    version: ToolchainVersion
  ): Promise<SnapshotForInstaller<Installer>[]> {
    const snapshots = await this.releasedTools(version)
    if (snapshots.length && !version.dev) {
      return this.sortSnapshots(snapshots)
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
    return this.sortSnapshots(snapshots)
  }

  abstract install(
    toolchain: SnapshotForInstaller<Installer>
  ): Promise<Installer>
}
