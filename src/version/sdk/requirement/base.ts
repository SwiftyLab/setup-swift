import * as core from '@actions/core'
import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
import {exec} from '@actions/exec'
import * as toolCache from '@actions/tool-cache'
import {SdkSnapshot} from '../../../snapshot'

export abstract class SdkRequirement {
  constructor(
    readonly platform: string,
    readonly downloadName?: string,
    readonly snapshotsFileName?: string
  ) {}

  get defaultVersion(): string | undefined {
    return undefined
  }

  get file(): string {
    return `${this.snapshotsFileName ?? this.platform}.yml`
  }

  download(version: string | undefined): string {
    const defaultSuffix =
      this.defaultVersion && this.defaultVersion.length > 0
        ? `-${this.defaultVersion}`
        : ''
    const versionSuffix =
      version && version.length > 0 ? `-${version}` : defaultSuffix
    return `${this.downloadName ?? this.platform}${versionSuffix}`
  }

  async setup(_snapshot: SdkSnapshot): Promise<void> {
    core.info(`No SDK setup required for ${this.toString()}`)
  }

  toString(): string {
    return this.platform
  }
}

export class DefaultSdk extends SdkRequirement {}

export class StaticLinux extends SdkRequirement {
  constructor() {
    super('static-sdk', 'static-linux')
  }

  get defaultVersion(): string | undefined {
    return '0.0.1'
  }
}

export class Wasm extends SdkRequirement {
  constructor() {
    super('wasm-sdk', 'wasm')
  }
}

export class Android extends SdkRequirement {
  constructor() {
    super('android-sdk', 'android', 'android-sdk')
  }

  async setup(snapshot: SdkSnapshot): Promise<void> {
    const homeDir = os.homedir()
    const swiftpmDirs = [
      path.join(homeDir, 'Library', 'org.swift.swiftpm'),
      path.join(homeDir, '.swiftpm'),
      path.join(homeDir, '.config', 'swiftpm')
    ]

    let targetDir = ''
    for (const [index, dir] of swiftpmDirs.entries()) {
      try {
        await fs.access(dir)
        targetDir = dir
        break
      } catch (error) {
        if (index < swiftpmDirs.length - 1) {
          continue
        }
        throw error
      }
    }

    core.info(`Using SwiftPM directory: ${targetDir}`)
    const sdksDir = path.join(targetDir, 'swift-sdks')
    const bundle = path.basename(snapshot.download, '.tar.gz')

    const androidDir = path.join(sdksDir, bundle, 'swift-android')
    const scriptPath = path.join(androidDir, 'scripts', 'setup-android-sdk.sh')
    await fs.access(scriptPath)

    const ndkUrl = `https://dl.google.com/android/repository/android-ndk-r27d-${os.type()}.zip`
    core.info(`Downloading Android NDK from ${ndkUrl}`)
    const ndkZip = await toolCache.downloadTool(ndkUrl)
    await toolCache.extractZip(ndkZip, androidDir)
    const ndkHome = path.join(androidDir, 'android-ndk-r27d')
    core.exportVariable('ANDROID_NDK_HOME', ndkHome)
    core.info(`Set ANDROID_NDK_HOME=${ndkHome}`)

    core.info(`Executing setup script: ${scriptPath}`)
    await exec('bash', [scriptPath])
    core.info('Android SDK setup completed successfully.')
  }
}
