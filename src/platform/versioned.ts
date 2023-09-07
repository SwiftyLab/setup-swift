import * as path from 'path'
import * as core from '@actions/core'
import {Platform} from './base'
import {ToolchainVersion} from '../version'
import {ToolchainInstaller, SnapshotForInstaller} from '../installer'

export abstract class VersionedPlatform<
  Installer extends ToolchainInstaller<SnapshotForInstaller<Installer>>
> extends Platform<Installer> {
  constructor(
    readonly name: string,
    readonly version: number,
    readonly arch: string
  ) {
    super()
  }

  private fileForVersion(version: number | string) {
    const archSuffix = this.arch === 'x86_64' ? '' : `-${this.arch}`
    return this.name + version + archSuffix
  }

  get file() {
    return this.fileForVersion(this.version)
  }

  protected get fileGlob() {
    return this.fileForVersion('*')
  }

  private fallbackFiles(files: string[]) {
    if (!files.length) {
      return []
    }

    const fileRegex = new RegExp(`${this.name}(?<version>[0-9]*)(-.*)?`)
    let maxVer: number | undefined
    let minVer: number | undefined
    for (const file of files) {
      const yml = path.extname(file)
      const filename = path.basename(file, yml)
      const match = fileRegex.exec(filename)
      const version = match?.groups?.version
      if (!version) {
        continue
      }
      const ver = parseInt(version)
      if (maxVer === undefined || maxVer < ver) maxVer = ver
      if (minVer === undefined || minVer > ver) minVer = ver
    }

    const selectedVer = maxVer ?? minVer
    if (!selectedVer || !files.length) {
      return []
    }
    const fallbackFiles = files.filter(file => {
      const yml = path.extname(file)
      const filename = path.basename(file, yml)
      const match = fileRegex.exec(filename)
      const version = match?.groups?.version
      if (!version) {
        return false
      }
      const ver = parseInt(version)
      return ver === selectedVer
    })
    return fallbackFiles
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
}
