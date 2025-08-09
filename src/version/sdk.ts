import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import {
  SWIFT_BUILDS_DIR,
  SWIFT_RELEASE_FILE,
  SWIFT_RELEASE_REGEX,
  ToolchainVersion
} from './base'
import {SdkSnapshot, SwiftRelease, ToolchainSnapshot} from '../snapshot'

export class SdkSupportedVersion<
  T extends ToolchainVersion
> extends ToolchainVersion {
  readonly requestedSdks: {platform: string; version: string | undefined}[]

  constructor(
    readonly baseVersion: T,
    requestedSdks: string[],
    dev: boolean
  ) {
    super(dev || baseVersion.dev)
    this.requestedSdks = requestedSdks.map(requestedSdk => {
      const [platform, version] = requestedSdk.split(':', 2)
      return {
        platform,
        version: this.fallbackVersion(platform, version)
      }
    })
  }

  fallbackVersion(platform: string, version: string | undefined) {
    switch (platform) {
      case 'static-sdk':
        if (version && version.length > 0) {
          return version
        }
        return '0.0.1'
      default:
        return version
    }
  }

  downloadForPlatform(platform: string) {
    switch (platform) {
      case 'static-sdk':
        return 'static-linux'
      case 'wasm-sdk':
        return 'wasm'
      default:
        return platform
    }
  }

  protected get dirGlob() {
    return this.baseVersion['dirGlob']
  }

  protected get dirRegex() {
    return this.baseVersion['dirRegex']
  }

  get requiresSwiftOrg() {
    return this.baseVersion.requiresSwiftOrg
  }

  toolchainSnapshot(platform: string) {
    return this.baseVersion.toolchainSnapshot(platform)
  }

  async toolFiles(fileGlob: string) {
    const baseFiles = await this.baseVersion.toolFiles(fileGlob)
    const baseFilesPromises = baseFiles.map(async file => {
      const requestedSdksPromises = this.requestedSdks.map(
        async requestedSdk => {
          const dir = path.dirname(file)
          try {
            try {
              const sdkPath = path.join(dir, `${requestedSdk.platform}.yml`)
              await fs.access(sdkPath)
            } catch {
              core.debug(`Retryng to find sdk config by replacing "-" with "_"`)
              const sdkPath = path.join(
                dir,
                `${requestedSdk.platform.replaceAll('-', '_')}.yml`
              )
              await fs.access(sdkPath)
            }
            return true
          } catch {
            core.debug(`No SDK file found for ${requestedSdk} in ${dir}`)
            return false
          }
        }
      )

      const requestedSdksResults = await Promise.all(requestedSdksPromises)
      return {
        value: file,
        include: requestedSdksResults.every(result => result)
      }
    })
    const baseFilesWithIncludes = await Promise.all(baseFilesPromises)
    return baseFilesWithIncludes
      .filter(file => file.include)
      .map(file => file.value)
  }

  satisfiedBy(release: SwiftRelease | string) {
    const baseSatisfied = this.baseVersion.satisfiedBy(release)
    if (!baseSatisfied || typeof release === 'string') {
      return baseSatisfied
    }

    return this.requestedSdks.every(requestedSdk => {
      return release.platforms.some(
        platform => platform.platform === requestedSdk.platform
      )
    })
  }

  private async getDevelopmentSdkSnapshots(
    toolchain: ToolchainSnapshot
  ): Promise<SdkSnapshot[]> {
    return await Promise.all(
      this.requestedSdks.map(async requestedSdk => {
        let data: string
        try {
          const yml = path.join(
            SWIFT_BUILDS_DIR,
            toolchain.branch.replaceAll('.', '_'),
            `${requestedSdk.platform}.yml`
          )
          data = await fs.readFile(yml, 'utf-8')
        } catch {
          core.debug(
            `Retryng to find sdk config data by replacing "-" with "_"`
          )
          const yml = path.join(
            SWIFT_BUILDS_DIR,
            toolchain.branch.replaceAll('.', '_'),
            `${requestedSdk.platform.replaceAll('-', '_')}.yml`
          )
          data = await fs.readFile(yml, 'utf-8')
        }
        const snapshots = yaml.load(data) as SdkSnapshot[]
        snapshots.sort((item1, item2) => {
          return item2.date.getTime() - item1.date.getTime()
        })
        return {
          ...snapshots[0],
          name: requestedSdk.platform,
          platform: requestedSdk.platform,
          branch: toolchain.branch,
          baseUrl: toolchain.baseUrl,
          preventCaching: true
        }
      })
    )
  }

  private async getReleasedSdkSnapshots(
    toolchain: ToolchainSnapshot
  ): Promise<SdkSnapshot[]> {
    const data = await fs.readFile(SWIFT_RELEASE_FILE, 'utf-8')
    const releases = yaml.load(data) as SwiftRelease[]
    const release = releases.find(release => release.tag === toolchain.dir)

    const snapshots: SdkSnapshot[] = []
    for (const platform of release?.platforms ?? []) {
      const requestedSdk = this.requestedSdks.find(
        requestedSdk => requestedSdk.platform == platform.platform
      )

      if (!requestedSdk) {
        continue
      }

      const versionSuffix =
        requestedSdk.version && requestedSdk.version.length > 0
          ? `-${requestedSdk.version}`
          : ''
      snapshots.push({
        name: platform.name,
        date: toolchain.date,
        download: `${toolchain.dir}_${this.downloadForPlatform(platform.platform)}${versionSuffix}.artifactbundle.tar.gz`,
        dir: toolchain.dir,
        platform: platform.platform,
        branch: toolchain.branch,
        baseUrl: toolchain.baseUrl,
        preventCaching: true,
        checksum: platform.checksum
      })
    }
    return snapshots
  }

  async sdkSnapshots(toolchain: ToolchainSnapshot): Promise<SdkSnapshot[]> {
    return SWIFT_RELEASE_REGEX.exec(toolchain.branch) != null
      ? await this.getReleasedSdkSnapshots(toolchain)
      : await this.getDevelopmentSdkSnapshots(toolchain)
  }

  toString() {
    return `${this.baseVersion.toString()}, sdks: [${this.requestedSdks.join(', ')}]`
  }
}
