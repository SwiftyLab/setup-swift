import * as os from 'os'
import * as path from 'path'
import {promises as fs, PathLike} from 'fs'
import {escapeRegExp} from 'lodash'
import {
  ToolchainVersion,
  SemanticToolchainVersion,
  LatestToolchainVersion,
  ToolchainSnapshotName,
  ToolchainSnapshotLocation
} from '../src/version'
import {StaticLinux, Wasm, Android} from '../src/version/sdk/requirement/base'
import {SdkSnapshot} from '../src/snapshot'
import * as toolCache from '@actions/tool-cache'
import * as exec from '@actions/exec'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@actions/exec', {spy: true})
vi.mock('os', {spy: true})

describe('parse version from provided string', () => {
  it('parses latest version', async () => {
    const version = ToolchainVersion.create('latest', false)
    expect(version).toBeInstanceOf(LatestToolchainVersion)
    expect(version.dev).toBe(false)
    expect(version.requiresSwiftOrg).toBe(true)
    expect(`${version}`).toBe('latest version')

    const devVersion = ToolchainVersion.create('latest', true)
    expect(devVersion).toBeInstanceOf(LatestToolchainVersion)
    expect(devVersion.dev).toBe(true)
    expect(version.requiresSwiftOrg).toBe(true)
    expect(`${devVersion}`).toBe('latest dev version')
  })

  it('parses current version', async () => {
    const version = ToolchainVersion.create('current', false)
    expect(version).toBeInstanceOf(LatestToolchainVersion)
    expect(version.dev).toBe(false)
    expect(version.requiresSwiftOrg).toBe(true)
    expect(`${version}`).toBe('latest version')

    const devVersion = ToolchainVersion.create('current', true)
    expect(devVersion).toBeInstanceOf(LatestToolchainVersion)
    expect(devVersion.dev).toBe(true)
    expect(version.requiresSwiftOrg).toBe(true)
    expect(`${devVersion}`).toBe('latest dev version')
  })

  it('parses X semver', async () => {
    const version = ToolchainVersion.create('5', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    expect(version.requiresSwiftOrg).toBe(true)
    expect(`${version}`).toBe('version: 5.0.0, dev: false')
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5/)
  })

  it('parses X.0 semver', async () => {
    const version = ToolchainVersion.create('5.0', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    expect(version.requiresSwiftOrg).toBe(true)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_0*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5\.0/)
  })

  it('parses X.0.0 semver', async () => {
    const version = ToolchainVersion.create('5.0.0', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    expect(version.requiresSwiftOrg).toBe(true)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_0-*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5\.0-/)
  })

  it('parses X.X semver', async () => {
    const version = ToolchainVersion.create('5.5', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    expect(version.requiresSwiftOrg).toBe(true)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_5*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5\.5/)
  })

  it('parses X.X.0 semver', async () => {
    const version = ToolchainVersion.create('5.5.0', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    expect(version.requiresSwiftOrg).toBe(true)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_5-*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5\.5-/)
  })

  it('parses X.X.X semver', async () => {
    const version = ToolchainVersion.create('5.5.1', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    expect(version.requiresSwiftOrg).toBe(true)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_5_1*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5\.5\.1/)
  })

  it('parses toolchain name', async () => {
    const name = 'swift-DEVELOPMENT-SNAPSHOT-2023-09-06-a'
    const version = ToolchainVersion.create(name, false)
    expect(version).toBeInstanceOf(ToolchainSnapshotName)
    expect(version.dev).toBe(true)
    expect(version.requiresSwiftOrg).toBe(true)
    const lVersion = version as ToolchainSnapshotName
    expect(lVersion['dirGlob']).toBe('*')
    expect(lVersion['dirRegex']).toStrictEqual(new RegExp(name))
  })

  it('parses toolchain name without prefix', async () => {
    const input = '5.9-DEVELOPMENT-SNAPSHOT-2023-09-05-a'
    const name = `swift-${input}`
    const version = ToolchainVersion.create(input, false)
    expect(version).toBeInstanceOf(ToolchainSnapshotName)
    expect(version.dev).toBe(true)
    expect(version.requiresSwiftOrg).toBe(true)
    const lVersion = version as ToolchainSnapshotName
    expect(lVersion['dirGlob']).toBe('swift-5_9-*')
    expect(lVersion['dirRegex']).toStrictEqual(new RegExp(escapeRegExp(name)))
  })

  it('parses toolchain URL', async () => {
    const swiftwasm = 'https://github.com/swiftwasm/swift/releases/download'
    const name = 'swift-wasm-5.10-SNAPSHOT-2024-03-30-a'
    const toolchainUrl = `${swiftwasm}/${name}/${name}-ubuntu22.04_x86_64.tar.gz`
    const version = ToolchainVersion.create(toolchainUrl, false)
    expect(version).toBeInstanceOf(ToolchainSnapshotLocation)
    const lVersion = version as ToolchainSnapshotLocation
    expect(lVersion['dirGlob']).toBe('')
    expect(lVersion['dirRegex']).toStrictEqual(/a^/)
    expect(lVersion.requiresSwiftOrg).toBe(false)
    expect(lVersion.url.href).toBe(toolchainUrl)
  })

  it('parses invalid input', async () => {
    const creation = () => ToolchainVersion.create('invalid', false)
    expect(creation).toThrow()
  })
})

describe('SdkRequirement setup method', () => {
  const mockSdkSnapshot: SdkSnapshot = {
    name: 'Test SDK',
    date: new Date('2024-01-01'),
    download: 'test-sdk.tar.gz',
    checksum: 'abc123',
    dir: 'test-sdk-dir',
    platform: 'test-platform',
    branch: 'main',
    preventCaching: false
  }

  it('calls setup on base SdkRequirement (StaticLinux)', async () => {
    const sdk = new StaticLinux()
    await sdk.setup(mockSdkSnapshot)
  })

  it('calls setup on Wasm SDK', async () => {
    const sdk = new Wasm()
    await sdk.setup(mockSdkSnapshot)
  })

  it('Android setup successfully executes script from first SwiftPM directory', async () => {
    const accessSpy = vi
      .spyOn(fs, 'access')
      .mockImplementation(
        async (path: PathLike, _mode?: number | undefined) => {
          const pathStr = path.toString()
          if (
            pathStr.includes('org.swift.swiftpm') ||
            pathStr.includes('setup-android-sdk.sh')
          ) {
            return
          }

          throw new Error('Directory not found')
        }
      )
    const execSpy = vi.spyOn(exec, 'exec').mockResolvedValue(0)
    const ndkzip = path.resolve('ndk', 'zip')
    const toolCacheDownloadSpy = vi
      .spyOn(toolCache, 'downloadTool')
      .mockResolvedValue(ndkzip)
    const toolCacheExtractSpy = vi
      .spyOn(toolCache, 'extractZip')
      .mockResolvedValue(path.resolve('ndk', 'extracted'))

    const sdk = new Android()
    await sdk.setup(mockSdkSnapshot)

    expect(accessSpy).toHaveBeenCalledTimes(2)
    expect(execSpy).toHaveBeenCalledWith('bash', [
      expect.stringContaining('setup-android-sdk.sh')
    ])
    expect(toolCacheDownloadSpy).toHaveBeenCalledWith(
      `https://dl.google.com/android/repository/android-ndk-r27d-${os.type()}.zip`
    )
    const homeDir = os.homedir()
    const sdkPath = path.join(
      homeDir,
      'Library',
      'org.swift.swiftpm',
      'swift-sdks',
      'test-sdk',
      'swift-android'
    )
    expect(toolCacheExtractSpy).toHaveBeenCalledWith(ndkzip, sdkPath)
  })

  it('Android setup successfully executes script from second SwiftPM directory', async () => {
    const accessSpy = vi
      .spyOn(fs, 'access')
      .mockImplementation(
        async (path: PathLike, _mode?: number | undefined) => {
          const pathStr = path.toString()
          if (
            (pathStr.includes('.swiftpm') &&
              !pathStr.includes('org.swift.swiftpm')) ||
            pathStr.includes('setup-android-sdk.sh')
          ) {
            return
          }

          throw new Error('Directory not found')
        }
      )
    const execSpy = vi.spyOn(exec, 'exec').mockResolvedValue(0)
    const ndkzip = path.resolve('ndk', 'zip')
    const toolCacheDownloadSpy = vi
      .spyOn(toolCache, 'downloadTool')
      .mockResolvedValue(ndkzip)
    const toolCacheExtractSpy = vi
      .spyOn(toolCache, 'extractZip')
      .mockResolvedValue(path.resolve('ndk', 'extracted'))

    const sdk = new Android()
    await sdk.setup(mockSdkSnapshot)

    expect(accessSpy).toHaveBeenCalledTimes(3)
    expect(execSpy).toHaveBeenCalledWith('bash', [
      expect.stringContaining('setup-android-sdk.sh')
    ])
    expect(toolCacheDownloadSpy).toHaveBeenCalledWith(
      `https://dl.google.com/android/repository/android-ndk-r27d-${os.type()}.zip`
    )
    const homeDir = os.homedir()
    const sdkPath = path.join(
      homeDir,
      '.swiftpm',
      'swift-sdks',
      'test-sdk',
      'swift-android'
    )
    expect(toolCacheExtractSpy).toHaveBeenCalledWith(ndkzip, sdkPath)
  })

  it('Android setup fails when SwiftPM directory not found', async () => {
    const accessSpy = vi
      .spyOn(fs, 'access')
      .mockImplementation(
        async (_path: PathLike, _mode?: number | undefined) => {
          throw new Error('Directory not found')
        }
      )

    const sdk = new Android()
    await expect(sdk.setup(mockSdkSnapshot)).rejects.toThrow(
      'Directory not found'
    )
    expect(accessSpy).toHaveBeenCalledTimes(3)
  })

  it('Android setup fails when setup script not found', async () => {
    const accessSpy = vi
      .spyOn(fs, 'access')
      .mockImplementation(
        async (path: PathLike, _mode?: number | undefined) => {
          const pathStr = path.toString()
          if (pathStr.includes('setup-android-sdk.sh')) {
            throw new Error('Directory not found')
          }
        }
      )

    const sdk = new Android()
    await expect(sdk.setup(mockSdkSnapshot)).rejects.toThrow(
      'Directory not found'
    )
    expect(accessSpy).toHaveBeenCalledTimes(2)
  })
})
