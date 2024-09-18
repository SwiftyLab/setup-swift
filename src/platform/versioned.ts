import * as path from 'path'
import * as core from '@actions/core'
import {Platform} from './base'
import {ToolchainVersion} from '../version'
import {ToolchainSnapshot} from '../snapshot'
import {ToolchainInstaller, SnapshotForInstaller} from '../installer'

export abstract class VersionedPlatform<
  Installer extends ToolchainInstaller<SnapshotForInstaller<Installer>>
> extends Platform<Installer> {
  protected abstract readonly downloadExtension: string

  constructor(
    readonly name: string,
    readonly version: number,
    readonly arch: string
  ) {
    super()
  }

  private get archSuffix() {
    return this.arch === 'x86_64' ? '' : `-${this.arch}`
  }

  private fileForVersion(version: number | string) {
    return this.name + version + this.archSuffix
  }

  get file() {
    return this.fileForVersion(this.version)
  }

  protected get fileGlob() {
    return this.fileForVersion('*')
  }

  private get nameRegex() {
    return new RegExp(`${this.name}(?<version>[0-9]*)(-.*)?`)
  }

  private fallbackPlatformVersion(platforms: string[]) {
    let maxVer: number | undefined
    let minVer: number | undefined
    for (const platform of platforms) {
      const match = this.nameRegex.exec(platform)
      const version = match?.groups?.version
      if (!version) {
        continue
      }
      const ver = parseInt(version)
      if (maxVer === undefined || maxVer < ver) maxVer = ver
      if (minVer === undefined || minVer > ver) minVer = ver
    }
    return maxVer ?? minVer
  }

  private fallbackFiles(files: string[]) {
    if (!files.length) {
      return []
    }

    const fallbackVer = this.fallbackPlatformVersion(
      files.map(file => {
        const yml = path.extname(file)
        return path.basename(file, yml)
      })
    )
    if (!fallbackVer || !files.length) {
      return []
    }
    return files.filter(file => {
      const yml = path.extname(file)
      const filename = path.basename(file, yml)
      const match = this.nameRegex.exec(filename)
      const versionStr = match?.groups?.version
      if (!versionStr) {
        return false
      }
      const ver = parseInt(versionStr)
      return ver === fallbackVer
    })
  }

  protected async toolFiles(version: ToolchainVersion) {
    let files = await super.toolFiles(version)
    const platformFiles = files.filter(file => {
      const yml = path.extname(file)
      return path.basename(file, yml) === this.file
    })

    if (platformFiles.length) {
      files = platformFiles
    } else {
      core.debug(`Using fallback toolchain data for platform "${this.name}"`)
      files = this.fallbackFiles(files)
    }
    return files
  }

  protected async releasedTools(version: ToolchainVersion) {
    const releases = await this.releases()
    const allReleasedTools = releases
      .filter(release => version.satisfiedBy(release.tag))
      .flatMap(release => {
        return release.platforms.flatMap(platform => {
          const pName =
            platform.dir ??
            platform.name.replaceAll(/\s+|\./g, '').toLowerCase()
          const pDownloadName =
            platform.dir ?? platform.name.replaceAll(/\s+/g, '').toLowerCase()
          const download = `${release.tag}-${pDownloadName}${this.archSuffix}.${this.downloadExtension}`
          return platform.archs && platform.archs.includes(this.arch)
            ? ({
                name: platform.name,
                date: release.date,
                download,
                download_signature: `${download}.sig`,
                dir: release.tag,
                platform: pName + this.archSuffix,
                branch: release.tag.toLocaleLowerCase(),
                docker: platform.docker,
                windows: pName.startsWith('windows'),
                preventCaching: false
              } as ToolchainSnapshot)
            : []
        })
      })
    const platformReleasedTools = allReleasedTools.filter(
      tool => tool.platform === this.file
    )
    if (platformReleasedTools.length) {
      return platformReleasedTools as SnapshotForInstaller<Installer>[]
    }

    const fallbackVer = this.fallbackPlatformVersion(
      allReleasedTools.map(tool => tool.platform)
    )
    return allReleasedTools.filter(tool => {
      const match = this.nameRegex.exec(tool.platform)
      const versionStr = match?.groups?.version
      if (!versionStr) {
        return false
      }
      const ver = parseInt(versionStr)
      return ver === fallbackVer
    }) as SnapshotForInstaller<Installer>[]
  }
}
