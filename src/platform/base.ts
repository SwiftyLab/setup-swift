import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import {ToolchainVersion} from '../version'
import {ToolchainSnapshot} from '../snapshot'
import {ToolchainInstaller, SnapshotForInstaller} from '../installer'

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

  async tools(
    version: ToolchainVersion
  ): Promise<SnapshotForInstaller<Installer>[]> {
    const files = await this.toolFiles(version)
    core.debug(`Using files "${files}" to get toolchains snapshot data`)

    const snapshotsCollection = await Promise.all(
      files.map(async file => {
        const ext = path.extname(file)
        const platform = path.basename(file, ext)
        const branch = path.basename(path.dirname(file)).replaceAll('_', '.')
        const data = await fs.readFile(file, 'utf-8')
        return {
          data: yaml.load(data) as [object],
          platform,
          branch
        }
      })
    )

    return snapshotsCollection
      .flatMap(snapshots => {
        return snapshots.data.map(data => {
          return {
            ...data,
            platform: snapshots.platform,
            branch: snapshots.branch
          } as SnapshotForInstaller<Installer>
        })
      })
      .filter(item => version.satisfiedBy((item as ToolchainSnapshot).dir))
      .sort(
        (item1, item2) =>
          (item2 as ToolchainSnapshot).date.getTime() -
          (item1 as ToolchainSnapshot).date.getTime()
      )
  }

  abstract install(
    toolchain: SnapshotForInstaller<Installer>
  ): Promise<Installer>
}
