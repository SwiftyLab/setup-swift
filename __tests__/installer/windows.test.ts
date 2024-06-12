import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as cache from '@actions/cache'
import * as toolCache from '@actions/tool-cache'
import {coerce as parseSemVer} from 'semver'
import {WindowsToolchainInstaller} from '../../src/installer/windows'
import {VisualStudio} from '../../src/utils/visual_studio'

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
    installationVersion: '16',
    catalog: {productDisplayVersion: '16'},
    properties: {
      setupEngineFilePath: path.join('C:', 'Visual Studio', 'setup.exe')
    }
  })
  const vsEnvs = [
    `UniversalCRTSdkDir=${path.join('C:', 'Windows Kits')}`,
    `UCRTVersion=10.0.17063`,
    `VCToolsInstallDir=${path.join('C:', 'Visual Studio', 'Tools')}`
  ]

  beforeEach(() => {
    process.env = {...env}
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = env
  })

  it('tests adding additional components', async () => {
    jest
      .spyOn(core, 'getInput')
      .mockReturnValue(
        'Microsoft.VisualStudio.Component.VC.ATL;Microsoft.VisualStudio.Component.VC.CMake.Project;Microsoft.VisualStudio.Component.Windows10SDK'
      )
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(installer['vsRequirement'].components.slice(2)).toStrictEqual([
      'Microsoft.VisualStudio.Component.VC.ATL',
      'Microsoft.VisualStudio.Component.VC.CMake.Project',
      'Microsoft.VisualStudio.Component.Windows10SDK'
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
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'rename').mockResolvedValue()
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([visualStudio]),
      stderr: ''
    })
    jest.spyOn(cache, 'restoreCache').mockResolvedValue(undefined)
    const cacheSpy = jest.spyOn(cache, 'saveCache').mockResolvedValue(1)
    jest.spyOn(toolCache, 'downloadTool').mockResolvedValue(download)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    await expect(installer['download']()).resolves.toBe(`${download}.exe`)
    expect(cacheSpy).not.toHaveBeenCalled()
  })

  it('tests unpack for default toolchains', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const exe = path.resolve('tool', 'downloaded', 'toolchain.exe')
    const extracted = path.resolve('tool', 'extracted', 'path')
    process.env.SystemDrive = 'C:'
    jest.spyOn(toolCache, 'extractTar').mockResolvedValue(extracted)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: ''
    })
    jest.spyOn(fs, 'access').mockRejectedValueOnce(new Error())
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'cp').mockResolvedValue()
    const toolPath = path.join(process.env.SystemDrive, 'Library')
    await expect(installer['unpack'](exe)).resolves.toBe(toolPath)
  })

  it('tests unpack for development snapshots', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const exe = path.resolve('tool', 'downloaded', 'toolchain.exe')
    const extracted = path.resolve('tool', 'extracted', 'path')
    process.env.SystemDrive = 'C:'
    jest.spyOn(toolCache, 'extractTar').mockResolvedValue(extracted)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: ''
    })
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'cp').mockResolvedValue()
    const toolPath = path.join(
      process.env.SystemDrive,
      'Program Files',
      'Swift'
    )
    await expect(installer['unpack'](exe)).resolves.toBe(toolPath)
  })

  it('tests unpack for failed path matching', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const exe = path.resolve('tool', 'downloaded', 'toolchain.exe')
    process.env.SystemDrive = 'C:'
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest
      .spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({exitCode: 0, stdout: '{}', stderr: ''})
      .mockResolvedValueOnce({exitCode: 0, stdout: '{"PATH":"a"}', stderr: ''})
      .mockResolvedValueOnce({exitCode: 0, stdout: '{}', stderr: ''})
      .mockResolvedValue({
        exitCode: 0,
        stdout: `{"SDKROOT":"root","PATH":"a${path.delimiter}b${path.delimiter}c"}`,
        stderr: ''
      })
    jest
      .spyOn(fs, 'access')
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue()
    jest.spyOn(fs, 'cp').mockRejectedValue(new Error())
    const addPathSpy = jest.spyOn(core, 'addPath')
    const exportVariableSpy = jest.spyOn(core, 'exportVariable')
    await expect(installer['unpack'](exe)).resolves.toBe('')
    expect(addPathSpy).toHaveBeenCalledTimes(2)
    expect(exportVariableSpy).toHaveBeenCalledTimes(1)
    expect(addPathSpy.mock.calls).toStrictEqual([['b'], ['c']])
    expect(exportVariableSpy.mock.calls).toStrictEqual([['SDKROOT', 'root']])
  })

  it('tests add to PATH', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const installation = path.resolve('tool', 'installed', 'path')
    jest.spyOn(VisualStudio, 'setup').mockResolvedValue(visualStudio)
    jest.spyOn(fs, 'access').mockRejectedValueOnce(new Error())
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'copyFile').mockResolvedValue()
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
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
    await installer['add'](installation)
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
    const setupSpy = jest
      .spyOn(VisualStudio, 'setup')
      .mockResolvedValue(visualStudio)
    jest.spyOn(fs, 'access').mockImplementation(async p => {
      if (
        typeof p === 'string' &&
        (p.startsWith(path.join(cached, 'Developer')) ||
          p.startsWith(path.join(cached, 'Swift')))
      ) {
        return Promise.resolve()
      }
      return Promise.reject(new Error())
    })
    jest.spyOn(fs, 'copyFile').mockResolvedValue()
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(toolCache, 'find').mockReturnValue(cached)
    jest.spyOn(toolCache, 'cacheDir').mockResolvedValue(cached)
    jest.spyOn(cache, 'saveCache').mockResolvedValue(1)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: vsEnvs.join(os.EOL),
      stderr: ''
    })
    await installer.install()
    expect(setupSpy).toHaveBeenCalled()
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(swiftDev)).toBeTruthy()
    expect(process.env.PATH?.includes(icu67)).toBeFalsy()
    expect(process.env.SDKROOT).toBe(sdkroot)
  })

  it('tests installed swift version detection', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: 'Swift version 5.8.1 (swift-5.8.1-RELEASE)',
      stderr: ''
    })
    const version = await installer.installedSwiftVersion()
    expect(version).toBe('5.8.1')

    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout:
        'Swift version 5.9-dev (LLVM 2631202ae58ad69, Swift 46ebb9dd1140c96)',
      stderr: ''
    })
    const devVersion = await installer.installedSwiftVersion()
    expect(devVersion).toBe('5.9-dev')
  })
})
