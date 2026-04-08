import * as path from 'path'
import {Dirent, promises as fs} from 'fs'
import {__setContent as setContent} from '../../__mocks__/https'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as cache from '@actions/cache'
import * as toolCache from '@actions/tool-cache'
import os from 'os'
import {coerce as parseSemVer} from 'semver'
import {WindowsToolchainInstaller} from '../../src/installer/windows'
import {VisualStudio} from '../../src/utils/visual_studio'
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'

vi.mock('https')
vi.mock('os', {spy: true})

vi.mock('@actions/cache', {spy: true})
vi.mock('@actions/core', {spy: true})
vi.mock('@actions/exec', {spy: true})
vi.mock('@actions/tool-cache', {spy: true})
vi.mock('fs', {spy: true})

describe('windows toolchain installation verification', () => {
  const env = process.env
  const toolchain = {
    name: 'Windows 10',
    date: new Date('2023-03-30 10:29:16.000000000 -05:00'),
    download: 'swift-5.8-RELEASE-windows10.exe',
    download_signature: 'swift-5.8-RELEASE-windows10.exe.sig',
    dir: 'swift-5.8-RELEASE',
    platform: 'windows10',
    branch: 'swift-5.8-release',
    windows: true,
    preventCaching: false
  }
  const visualStudio = VisualStudio.createFromJSON({
    installationPath: path.join('C:', 'Visual Studio'),
    installationVersion: '17',
    catalog: {productDisplayVersion: '17'},
    properties: {
      setupEngineFilePath: path.join('C:', 'Visual Studio', 'setup.exe')
    },
    components: [
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      'Microsoft.VisualStudio.Component.Windows11SDK.22621'
    ]
  })
  const vsEnvs = [
    `UniversalCRTSdkDir=${path.join('C:', 'Windows Kits')}`,
    `UCRTVersion=10.0.22000`,
    `VCToolsInstallDir=${path.join('C:', 'Visual Studio', 'Tools')}`
  ]

  beforeEach(() => {
    process.env = {...env}
  })

  afterEach(() => {
    vi.resetAllMocks()
    process.env = env
  })

  it('tests adding additional components', async () => {
    vi.spyOn(os, 'release').mockReturnValue('10.0.17063')
    vi.spyOn(core, 'getInput').mockReturnValue(
      'Microsoft.VisualStudio.Component.VC.ATL;Microsoft.VisualStudio.Component.VC.CMake.Project;Microsoft.VisualStudio.Component.Windows10SDK'
    )
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(
      (await installer['vsRequirement']('x86_64')).components
    ).toStrictEqual([
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      'Microsoft.VisualStudio.Component.VC.ATL',
      'Microsoft.VisualStudio.Component.VC.CMake.Project',
      'Microsoft.VisualStudio.Component.Windows10SDK',
      'Microsoft.VisualStudio.Component.Windows10SDK.17763'
    ])
  })

  it('tests setting up on Windows 10', async () => {
    vi.spyOn(os, 'release').mockReturnValue('10.0.17063')
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(
      (await installer['vsRequirement']('x86_64')).components
    ).toStrictEqual([
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      'Microsoft.VisualStudio.Component.Windows10SDK.17763'
    ])
  })

  it('tests setting up on ARM64 Windows 10', async () => {
    vi.spyOn(os, 'release').mockReturnValue('10.0.17063')
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(
      (await installer['vsRequirement']('arm64')).components
    ).toStrictEqual([
      'Microsoft.VisualStudio.Component.VC.Tools.ARM64',
      'Microsoft.VisualStudio.Component.Windows10SDK.17763'
    ])
  })

  it('tests setting up on Windows 11', async () => {
    vi.spyOn(os, 'release').mockReturnValue('10.0.22621')
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(
      (await installer['vsRequirement']('x86_64')).components
    ).toStrictEqual([
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      'Microsoft.VisualStudio.Component.Windows11SDK.22621'
    ])
  })

  it('tests setting up on Windows 11 with custom SDK', async () => {
    vi.spyOn(os, 'release').mockReturnValue('10.0.26100')
    vi.spyOn(core, 'getInput').mockReturnValue(
      'Microsoft.VisualStudio.Component.Windows11SDK.22621'
    )
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(
      (await installer['vsRequirement']('x86_64')).components
    ).toStrictEqual([
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      'Microsoft.VisualStudio.Component.Windows11SDK.22621'
    ])
  })

  it('tests setting up on Windows 10 with Windows 11 SDK', async () => {
    vi.spyOn(os, 'release').mockReturnValue('10.0.17063')
    const toolchain = {
      name: 'Windows 10 Swift Development Snapshot',
      date: new Date('2025-04-03 10:10:00-06:00'),
      download: 'swift-DEVELOPMENT-SNAPSHOT-2025-04-03-a-windows10.exe',
      dir: 'swift-DEVELOPMENT-SNAPSHOT-2025-04-03-a',
      platform: 'windows10',
      branch: 'development',
      windows: true,
      preventCaching: false
    }
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(
      (await installer['vsRequirement']('arm64')).components
    ).toStrictEqual([
      'Microsoft.VisualStudio.Component.VC.Tools.ARM64',
      'Microsoft.VisualStudio.Component.Windows11SDK.22000'
    ])
  })

  it('tests setting up on Windows 10 with Windows 11 SDK with unavailable recommended SDK', async () => {
    vi.spyOn(os, 'release').mockReturnValue('10.0.17063')
    vi.spyOn(fs, 'readdir').mockResolvedValue([
      {
        name: 'wdf',
        isDirectory: () => true
      } as unknown as Dirent,
      {
        name: '10.0.22621.0',
        isDirectory: () => true
      } as unknown as Dirent
    ])
    const toolchain = {
      name: 'Windows 10 Swift Development Snapshot',
      date: new Date('2025-04-03 10:10:00-06:00'),
      download: 'swift-DEVELOPMENT-SNAPSHOT-2025-04-03-a-windows10.exe',
      dir: 'swift-DEVELOPMENT-SNAPSHOT-2025-04-03-a',
      platform: 'windows10',
      branch: 'development',
      windows: true,
      preventCaching: false
    }
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(
      (await installer['vsRequirement']('arm64')).components
    ).toStrictEqual([
      'Microsoft.VisualStudio.Component.VC.Tools.ARM64',
      'Microsoft.VisualStudio.Component.Windows11SDK.22621'
    ])
  })

  it('tests download without caching', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(installer['version']).toStrictEqual(parseSemVer('5.8'))
    expect(installer['baseUrl'].href).toBe(
      'https://download.swift.org/swift-5.8-release/windows10/swift-5.8-RELEASE'
    )

    const download = path.resolve('tool', 'download', 'path')
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    vi.spyOn(fs, 'access').mockResolvedValue()
    vi.spyOn(fs, 'rename').mockResolvedValue()
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    const execSpy = vi.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([visualStudio]),
      stderr: ''
    })
    vi.spyOn(cache, 'restoreCache').mockResolvedValue(undefined)
    const cacheSpy = vi.spyOn(cache, 'saveCache').mockResolvedValue(1)
    vi.spyOn(toolCache, 'downloadTool').mockResolvedValue(download)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    await expect(installer['download']('x86_64')).resolves.toBe(
      `${download}.exe`
    )
    expect(execSpy).not.toHaveBeenCalled()
    expect(cacheSpy).not.toHaveBeenCalled()
  })

  it('tests download without caching with custom Visual Studio components', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(installer['version']).toStrictEqual(parseSemVer('5.8'))
    expect(installer['baseUrl'].href).toBe(
      'https://download.swift.org/swift-5.8-release/windows10/swift-5.8-RELEASE'
    )

    const download = path.resolve('tool', 'download', 'path')
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    vi.spyOn(fs, 'access').mockResolvedValue()
    vi.spyOn(fs, 'rename').mockResolvedValue()
    vi.spyOn(core, 'getInput').mockReturnValue(' ')
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    const execSpy = vi.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([visualStudio]),
      stderr: ''
    })
    vi.spyOn(cache, 'restoreCache').mockResolvedValue(undefined)
    const cacheSpy = vi.spyOn(cache, 'saveCache').mockResolvedValue(1)
    vi.spyOn(toolCache, 'downloadTool').mockResolvedValue(download)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    await expect(installer['download']('x86_64')).resolves.toBe(
      `${download}.exe`
    )
    expect(execSpy).toHaveBeenCalled()
    expect(cacheSpy).not.toHaveBeenCalled()
  })

  it('tests unpack for default toolchains', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const exe = path.resolve('tool', 'downloaded', 'toolchain.exe')
    const extracted = path.resolve('tool', 'extracted', 'path')
    process.env.SystemDrive = 'C:'
    vi.spyOn(toolCache, 'extractTar').mockResolvedValue(extracted)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: ''
    })
    vi.spyOn(fs, 'access').mockRejectedValueOnce(new Error())
    vi.spyOn(fs, 'access').mockResolvedValue()
    vi.spyOn(fs, 'cp').mockResolvedValue()
    const toolPath = path.join(process.env.SystemDrive, 'Library')
    await expect(installer['unpack'](exe, 'x86_64')).resolves.toBe(toolPath)
  })

  it('tests unpack for development snapshots', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const exe = path.resolve('tool', 'downloaded', 'toolchain.exe')
    const extracted = path.resolve('tool', 'extracted', 'path')
    process.env.SystemDrive = 'C:'
    vi.spyOn(toolCache, 'extractTar').mockResolvedValue(extracted)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: ''
    })
    vi.spyOn(fs, 'access').mockResolvedValue()
    vi.spyOn(fs, 'cp').mockResolvedValue()
    const toolPath = path.join(
      process.env.SystemDrive,
      'Program Files',
      'Swift'
    )
    await expect(installer['unpack'](exe, 'x86_64')).resolves.toBe(toolPath)
  })

  it('tests unpack for failed path matching', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const exe = path.resolve('tool', 'downloaded', 'toolchain.exe')
    process.env.SystemDrive = 'C:'
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({exitCode: 0, stdout: '{}', stderr: ''})
      .mockResolvedValueOnce({exitCode: 0, stdout: '{"PATH":"a"}', stderr: ''})
      .mockResolvedValueOnce({exitCode: 0, stdout: '{}', stderr: ''})
      .mockResolvedValue({
        exitCode: 0,
        stdout: `{"SDKROOT":"root","PATH":"a${path.delimiter}b${path.delimiter}c"}`,
        stderr: ''
      })
    vi.spyOn(fs, 'access')
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue()
    vi.spyOn(fs, 'cp').mockRejectedValue(new Error())
    const addPathSpy = vi.spyOn(core, 'addPath')
    const exportVariableSpy = vi.spyOn(core, 'exportVariable')
    await expect(installer['unpack'](exe, 'x86_64')).resolves.toBe('')
    expect(addPathSpy).toHaveBeenCalledTimes(2)
    expect(exportVariableSpy).toHaveBeenCalledTimes(1)
    expect(addPathSpy.mock.calls).toStrictEqual([['b'], ['c']])
    expect(exportVariableSpy.mock.calls).toStrictEqual([['SDKROOT', 'root']])

    vi.spyOn(exec, 'getExecOutput').mockResolvedValueOnce({
      exitCode: 0,
      stdout: 'Apple Swift version 5.8',
      stderr: ''
    })
    const setupSpy = vi
      .spyOn(VisualStudio, 'setup')
      .mockResolvedValue(visualStudio)
    const updateSpy = vi
      .spyOn(VisualStudio.prototype, 'update')
      .mockResolvedValue()
    await installer['add']('', 'x86_64')
    expect(setupSpy).toHaveBeenCalled()
    expect(updateSpy).toHaveBeenCalledWith('root')
  })

  it('tests unpack for failed path matching without additional module setup', async () => {
    const installer = new WindowsToolchainInstaller({
      name: 'Windows 10',
      date: new Date('2023-03-30 10:29:16.000000000 -05:00'),
      download: 'swift-6.0.2-RELEASE-windows10.exe',
      download_signature: 'swift-6.0.2-RELEASE-windows10.exe.sig',
      dir: 'swift-6.0.2-RELEASE',
      platform: 'windows10',
      branch: 'swift-6.0.2-release',
      windows: true,
      preventCaching: false
    })
    const exe = path.resolve('tool', 'downloaded', 'toolchain.exe')
    process.env.SystemDrive = 'C:'
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({exitCode: 0, stdout: '{}', stderr: ''})
      .mockResolvedValueOnce({exitCode: 0, stdout: '{"PATH":"a"}', stderr: ''})
      .mockResolvedValueOnce({exitCode: 0, stdout: '{}', stderr: ''})
      .mockResolvedValue({
        exitCode: 0,
        stdout: `{"SDKROOT":"root","PATH":"a${path.delimiter}b${path.delimiter}c"}`,
        stderr: ''
      })
    vi.spyOn(fs, 'access')
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue()
    vi.spyOn(fs, 'cp').mockRejectedValue(new Error())
    const addPathSpy = vi.spyOn(core, 'addPath')
    const exportVariableSpy = vi.spyOn(core, 'exportVariable')
    await expect(installer['unpack'](exe, 'x86_64')).resolves.toBe('')
    expect(addPathSpy).toHaveBeenCalledTimes(2)
    expect(exportVariableSpy).toHaveBeenCalledTimes(1)
    expect(addPathSpy.mock.calls).toStrictEqual([['b'], ['c']])
    expect(exportVariableSpy.mock.calls).toStrictEqual([['SDKROOT', 'root']])

    vi.spyOn(exec, 'getExecOutput').mockResolvedValueOnce({
      exitCode: 0,
      stdout: 'Apple Swift version 5.8',
      stderr: ''
    })
    const setupSpy = vi
      .spyOn(VisualStudio, 'setup')
      .mockResolvedValue(visualStudio)
    const updateSpy = vi
      .spyOn(VisualStudio.prototype, 'update')
      .mockResolvedValue()
    await installer['add']('', 'x86_64')
    expect(setupSpy).toHaveBeenCalled()
    expect(updateSpy).toHaveBeenCalledWith('root')
  })

  it('tests add to PATH', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const installation = path.resolve('tool', 'installed', 'path')
    vi.spyOn(VisualStudio, 'setup').mockResolvedValue(visualStudio)
    vi.spyOn(fs, 'access')
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue()
    vi.spyOn(fs, 'copyFile').mockResolvedValue()
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Apple Swift version 5.8',
        stderr: ''
      })
      .mockResolvedValue({
        exitCode: 0,
        stdout: vsEnvs.join(os.EOL),
        stderr: ''
      })
    const toolPath = path.join(
      installation,
      'Developer',
      'Toolchains',
      'unknown-Asserts-development.xctoolchain'
    )
    const sdkroot = path.join(
      installation,
      'Developer',
      'Platforms',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    const swiftLibs = path.join(sdkroot, 'usr', 'lib', 'swift')
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    const swiftDev = path.join(installation, 'Swift-development', 'bin')
    const icu67 = path.join(installation, 'icu-67', 'usr', 'bin')
    await installer['add'](installation, 'x86_64')
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(swiftDev)).toBeTruthy()
    expect(process.env.PATH?.includes(icu67)).toBeTruthy()
    expect(process.env.SDKROOT).toBe(sdkroot)
    expect(process.env.SWIFTFLAGS).toContain(`-sdk ${sdkroot}`)
    expect(process.env.SWIFTFLAGS).toContain(`-I ${swiftLibs}`)
    expect(process.env.SWIFTFLAGS).toContain(
      `-L ${path.join(swiftLibs, 'windows')}`
    )
  })

  it('tests add to PATH with fallback SDK copying', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const installation = path.resolve('tool', 'installed', 'path')
    vi.spyOn(VisualStudio, 'setup').mockResolvedValue(visualStudio)
    vi.spyOn(fs, 'access')
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockImplementation(async p => {
        if (typeof p === 'string' && p.endsWith('vcruntime.modulemap')) {
          return Promise.reject(new Error())
        }
        return Promise.resolve()
      })
    vi.spyOn(fs, 'copyFile').mockResolvedValue()
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Apple Swift version 5.8',
        stderr: ''
      })
      .mockResolvedValue({
        exitCode: 0,
        stdout: vsEnvs.join(os.EOL),
        stderr: ''
      })
    const toolPath = path.join(
      installation,
      'Developer',
      'Toolchains',
      'unknown-Asserts-development.xctoolchain'
    )
    const sdkroot = path.join(
      installation,
      'Developer',
      'Platforms',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    const swiftLibs = path.join(sdkroot, 'usr', 'lib', 'swift')
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    const swiftDev = path.join(installation, 'Swift-development', 'bin')
    const icu67 = path.join(installation, 'icu-67', 'usr', 'bin')
    await installer['add'](installation, 'x86_64')
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(swiftDev)).toBeTruthy()
    expect(process.env.PATH?.includes(icu67)).toBeTruthy()
    expect(process.env.SDKROOT).toBe(sdkroot)
    expect(process.env.SWIFTFLAGS).toContain(`-sdk ${sdkroot}`)
    expect(process.env.SWIFTFLAGS).toContain(`-I ${swiftLibs}`)
    expect(process.env.SWIFTFLAGS).toContain(
      `-L ${path.join(swiftLibs, 'windows')}`
    )
  })

  it('tests add to PATH without SDK copying', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const installation = path.resolve('tool', 'installed', 'path')
    const vsSetupSpy = vi
      .spyOn(VisualStudio, 'setup')
      .mockResolvedValue(visualStudio)
    vi.spyOn(fs, 'access')
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockImplementation(async p => {
        if (
          typeof p === 'string' &&
          (p.endsWith('ucrt.modulemap') || p.endsWith('winsdk.modulemap'))
        ) {
          return Promise.reject(new Error())
        }
        return Promise.resolve()
      })
    vi.spyOn(fs, 'copyFile').mockResolvedValue()
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    vi.spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Apple Swift version 5.8',
        stderr: ''
      })
      .mockResolvedValue({
        exitCode: 0,
        stdout: vsEnvs.join(os.EOL),
        stderr: ''
      })
    const toolPath = path.join(
      installation,
      'Developer',
      'Toolchains',
      'unknown-Asserts-development.xctoolchain'
    )
    const sdkroot = path.join(
      installation,
      'Developer',
      'Platforms',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    const swiftLibs = path.join(sdkroot, 'usr', 'lib', 'swift')
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    const swiftDev = path.join(installation, 'Swift-development', 'bin')
    const icu67 = path.join(installation, 'icu-67', 'usr', 'bin')
    await installer['add'](installation, 'x86_64')
    expect(vsSetupSpy).toHaveBeenCalled()
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(swiftDev)).toBeTruthy()
    expect(process.env.PATH?.includes(icu67)).toBeTruthy()
    expect(process.env.SDKROOT).toBe(sdkroot)
    expect(process.env.SWIFTFLAGS).toContain(`-sdk ${sdkroot}`)
    expect(process.env.SWIFTFLAGS).toContain(`-I ${swiftLibs}`)
    expect(process.env.SWIFTFLAGS).toContain(
      `-L ${path.join(swiftLibs, 'windows')}`
    )
  })

  it('tests add to PATH without SDK copying Swift 5.9.1', async () => {
    const toolchain = {
      name: 'Windows 10',
      date: new Date('2023-10-19'),
      download: 'swift-5.9-RELEASE-windows10.exe',
      download_signature: 'swift-5.9.1-RELEASE-windows10.exe.sig',
      dir: 'swift-5.9.1-RELEASE',
      platform: 'windows10',
      branch: 'swift-5.9.1-release',
      windows: true,
      preventCaching: false
    }
    const installer = new WindowsToolchainInstaller(toolchain)
    const installation = path.resolve('tool', 'installed', 'path')
    const vsSetupSpy = vi.spyOn(VisualStudio, 'setup')
    vi.spyOn(fs, 'access')
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockImplementation(async p => {
        if (
          typeof p === 'string' &&
          (p.endsWith('ucrt.modulemap') || p.endsWith('winsdk.modulemap'))
        ) {
          return Promise.reject(new Error())
        }
        return Promise.resolve()
      })
    vi.spyOn(fs, 'copyFile').mockResolvedValue()
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Apple Swift version 5.9.1',
        stderr: ''
      })
      .mockResolvedValue({
        exitCode: 0,
        stdout: vsEnvs.join(os.EOL),
        stderr: ''
      })
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    const toolPath = path.join(
      installation,
      'Developer',
      'Toolchains',
      'unknown-Asserts-development.xctoolchain'
    )
    const sdkroot = path.join(
      installation,
      'Developer',
      'Platforms',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    const swiftLibs = path.join(sdkroot, 'usr', 'lib', 'swift')
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    const swiftDev = path.join(installation, 'Swift-development', 'bin')
    const icu67 = path.join(installation, 'icu-67', 'usr', 'bin')
    await installer['add'](installation, 'x86_64')
    expect(vsSetupSpy).not.toHaveBeenCalled()
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(swiftDev)).toBeTruthy()
    expect(process.env.PATH?.includes(icu67)).toBeTruthy()
    expect(process.env.SDKROOT).toBe(sdkroot)
    expect(process.env.SWIFTFLAGS).toContain(`-sdk ${sdkroot}`)
    expect(process.env.SWIFTFLAGS).toContain(`-I ${swiftLibs}`)
    expect(process.env.SWIFTFLAGS).toContain(
      `-L ${path.join(swiftLibs, 'windows')}`
    )
  })

  it('tests add to PATH without SDK copying Swift 5.9.1 with Visual Studio linker', async () => {
    const toolchain = {
      name: 'Windows 10',
      date: new Date('2023-10-19'),
      download: 'swift-5.9-RELEASE-windows10.exe',
      download_signature: 'swift-5.9.1-RELEASE-windows10.exe.sig',
      dir: 'swift-5.9.1-RELEASE',
      platform: 'windows10',
      branch: 'swift-5.9.1-release',
      windows: true,
      preventCaching: false
    }
    const installer = new WindowsToolchainInstaller(toolchain)
    const installation = path.resolve('tool', 'installed', 'path')
    const vsSetupSpy = vi
      .spyOn(VisualStudio, 'setup')
      .mockResolvedValue(visualStudio)
    vi.spyOn(fs, 'access')
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockImplementation(async p => {
        if (
          typeof p === 'string' &&
          (p.endsWith('ucrt.modulemap') || p.endsWith('winsdk.modulemap'))
        ) {
          return Promise.reject(new Error())
        }
        return Promise.resolve()
      })
    vi.spyOn(fs, 'copyFile').mockResolvedValue()
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Apple Swift version 5.9.1',
        stderr: ''
      })
      .mockResolvedValue({
        exitCode: 0,
        stdout: vsEnvs.join(os.EOL),
        stderr: ''
      })
    vi.spyOn(core, 'getBooleanInput').mockImplementation(name => {
      return name === 'prefer-visual-studio-linker'
    })
    const toolPath = path.join(
      installation,
      'Developer',
      'Toolchains',
      'unknown-Asserts-development.xctoolchain'
    )
    const sdkroot = path.join(
      installation,
      'Developer',
      'Platforms',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    const swiftLibs = path.join(sdkroot, 'usr', 'lib', 'swift')
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    const swiftDev = path.join(installation, 'Swift-development', 'bin')
    const icu67 = path.join(installation, 'icu-67', 'usr', 'bin')
    await installer['add'](installation, 'x86_64')
    expect(vsSetupSpy).toHaveBeenCalled()
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(swiftDev)).toBeTruthy()
    expect(process.env.PATH?.includes(icu67)).toBeTruthy()
    expect(process.env.SDKROOT).toBe(sdkroot)
    expect(process.env.SWIFTFLAGS).toContain(`-sdk ${sdkroot}`)
    expect(process.env.SWIFTFLAGS).toContain(`-I ${swiftLibs}`)
    expect(process.env.SWIFTFLAGS).toContain(
      `-L ${path.join(swiftLibs, 'windows')}`
    )
  })

  it('tests add to PATH with latest modulemap definitions Swift 5.9.1 with Visual Studio linker', async () => {
    const toolchain = {
      name: 'Windows 10',
      date: new Date('2023-10-19'),
      download: 'swift-5.9-RELEASE-windows10.exe',
      download_signature: 'swift-5.9.1-RELEASE-windows10.exe.sig',
      dir: 'swift-5.9.1-RELEASE',
      platform: 'windows10',
      branch: 'swift-5.9.1-release',
      windows: true,
      preventCaching: false
    }
    const installer = new WindowsToolchainInstaller(toolchain)
    const installation = path.resolve('tool', 'installed', 'path')
    const vsSetupSpy = vi
      .spyOn(VisualStudio, 'setup')
      .mockResolvedValue(visualStudio)
    vi.spyOn(fs, 'access')
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue()
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Apple Swift version 5.9.1',
        stderr: ''
      })
      .mockResolvedValue({
        exitCode: 0,
        stdout: vsEnvs.join(os.EOL),
        stderr: ''
      })
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    setContent({
      statusCode: 200,
      data: '',
      headers: {
        'content-type': 'text/plain'
      }
    })
    const mkdirSpy = vi
      .spyOn(fs, 'mkdir')
      .mockImplementation(async path => Promise.resolve(path.toString()))
    vi.spyOn(fs, 'copyFile').mockResolvedValue()
    const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue()
    const toolPath = path.join(
      installation,
      'Developer',
      'Toolchains',
      'unknown-Asserts-development.xctoolchain'
    )
    const sdkroot = path.join(
      installation,
      'Developer',
      'Platforms',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    const swiftLibs = path.join(sdkroot, 'usr', 'lib', 'swift')
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    const swiftDev = path.join(installation, 'Swift-development', 'bin')
    const icu67 = path.join(installation, 'icu-67', 'usr', 'bin')
    await installer['add'](installation, 'x86_64')
    expect(vsSetupSpy).toHaveBeenCalled()
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(swiftDev)).toBeTruthy()
    expect(process.env.PATH?.includes(icu67)).toBeTruthy()
    expect(process.env.SDKROOT).toBe(sdkroot)
    expect(process.env.SWIFTFLAGS).toContain(`-sdk ${sdkroot}`)
    expect(process.env.SWIFTFLAGS).toContain(`-I ${swiftLibs}`)
    expect(process.env.SWIFTFLAGS).toContain(
      `-L ${path.join(swiftLibs, 'windows')}`
    )

    const usrShare = path.join(sdkroot, 'usr', 'share')
    const clangInclude = path.join(
      installation,
      'Swift',
      'runtime-development',
      'usr',
      'lib',
      'swift',
      'clang',
      'include'
    )
    expect(mkdirSpy).toHaveBeenCalledTimes(2)
    expect(mkdirSpy.mock.calls[0][0]).toBe(usrShare)
    expect(mkdirSpy.mock.calls[1][0]).toBe(clangInclude)
    expect(writeFileSpy).toHaveBeenCalledTimes(7)
    expect(writeFileSpy.mock.calls[0][0]).toBe(
      path.join(usrShare, 'winsdk.modulemap')
    )
    expect(writeFileSpy.mock.calls[1][0]).toBe(
      path.join(usrShare, 'winsdk_um.modulemap')
    )
    expect(writeFileSpy.mock.calls[2][0]).toBe(
      path.join(usrShare, 'winsdk_shared.modulemap')
    )
    expect(writeFileSpy.mock.calls[3][0]).toBe(
      path.join(usrShare, 'ucrt.modulemap')
    )
    expect(writeFileSpy.mock.calls[4][0]).toBe(
      path.join(usrShare, 'vcruntime.modulemap')
    )
    expect(writeFileSpy.mock.calls[5][0]).toBe(
      path.join(usrShare, 'vcruntime.apinotes')
    )
    expect(writeFileSpy.mock.calls[6][0]).toBe(
      path.join(clangInclude, 'module.modulemap')
    )
  })

  it('tests add to PATH with third directory layout (Swift 6.3)', async () => {
    const toolchain = {
      name: 'Windows 10',
      date: new Date('2025-03-12'),
      download: 'swift-6.3-RELEASE-windows10.exe',
      download_signature: 'swift-6.3-RELEASE-windows10.exe.sig',
      dir: 'swift-6.3-RELEASE',
      platform: 'windows10',
      branch: 'swift-6.3-release',
      windows: true,
      preventCaching: false
    }
    const installer = new WindowsToolchainInstaller(toolchain)
    const installation = path.resolve('tool', 'installed', 'path')
    vi.spyOn(fs, 'access').mockResolvedValue()
    vi.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    vi.spyOn(exec, 'getExecOutput').mockResolvedValueOnce({
      exitCode: 0,
      stdout: 'Swift version 6.3 (swift-6.3-RELEASE)',
      stderr: ''
    })
    const toolPath = path.join(installation, 'Toolchains', '6.3.0+Asserts')
    const sdkroot = path.join(
      installation,
      'Platforms',
      '6.3.0',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    const swiftLibs = path.join(sdkroot, 'usr', 'lib', 'swift')
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    const runtimePath = path.join(
      installation,
      'Runtimes',
      '6.3.0',
      'usr',
      'bin'
    )
    await installer['add'](installation, 'x86_64')
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(runtimePath)).toBeTruthy()
    expect(process.env.SDKROOT).toBe(sdkroot)
    expect(process.env.SWIFTFLAGS).toContain(`-sdk ${sdkroot}`)
    expect(process.env.SWIFTFLAGS).toContain(`-I ${swiftLibs}`)
    expect(process.env.SWIFTFLAGS).toContain(
      `-L ${path.join(swiftLibs, 'windows')}`
    )
  })

  it('tests installation with cache', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const cached = path.resolve('tool', 'cached', 'path')
    const toolPath = path.join(
      cached,
      'Developer',
      'Toolchains',
      'unknown-Asserts-development.xctoolchain'
    )
    const sdkroot = path.join(
      cached,
      'Developer',
      'Platforms',
      'Windows.platform',
      'Developer',
      'SDKs',
      'Windows.sdk'
    )
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    const swiftDev = path.join(cached, 'Swift-development', 'bin')
    const icu67 = path.join(cached, 'icu-67', 'usr', 'bin')
    const setupSpy = vi
      .spyOn(VisualStudio, 'setup')
      .mockResolvedValue(visualStudio)
    vi.spyOn(fs, 'access').mockImplementation(async p => {
      if (
        typeof p === 'string' &&
        (p.startsWith(path.join(cached, 'Developer')) ||
          p.startsWith(path.join(cached, 'Swift')))
      ) {
        return Promise.resolve()
      }
      return Promise.reject(new Error())
    })
    vi.spyOn(fs, 'copyFile').mockResolvedValue()
    vi.spyOn(core, 'getBooleanInput').mockImplementation(name => {
      return name === 'cache-snapshot'
    })
    vi.spyOn(toolCache, 'find').mockReturnValue(cached)
    vi.spyOn(toolCache, 'cacheDir').mockResolvedValue(cached)
    vi.spyOn(cache, 'saveCache').mockResolvedValue(1)
    vi.spyOn(exec, 'exec').mockResolvedValue(0)
    vi.spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Apple Swift version 5.8',
        stderr: ''
      })
      .mockResolvedValue({
        exitCode: 0,
        stdout: vsEnvs.join(os.EOL),
        stderr: ''
      })
    await installer.install('x86_64', false)
    expect(setupSpy).toHaveBeenCalled()
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(swiftDev)).toBeTruthy()
    expect(process.env.PATH?.includes(icu67)).toBeFalsy()
    expect(process.env.SDKROOT).toBe(sdkroot)
  })

  it('tests installed swift version detection', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    vi.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: 'Swift version 5.8.1 (swift-5.8.1-RELEASE)',
      stderr: ''
    })
    const version = await installer.installedSwiftVersion()
    expect(version).toBe('5.8.1')

    vi.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout:
        'Swift version 5.9-dev (LLVM 2631202ae58ad69, Swift 46ebb9dd1140c96)',
      stderr: ''
    })
    const devVersion = await installer.installedSwiftVersion()
    expect(devVersion).toBe('5.9-dev')
  })
})
