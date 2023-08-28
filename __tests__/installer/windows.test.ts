import * as path from 'path'
import {promises as fs} from 'fs'
import * as exec from '@actions/exec'
import * as toolCache from '@actions/tool-cache'
import {coerce as parseSemVer} from 'semver'
import {WindowsToolchainInstaller} from '../../src/installer/windows'
import * as vs from '../../src/utils/visual_studio'

describe('windows toolchain installation verification', () => {
  const env = process.env
  const toolchain = {
    name: 'Windows 10',
    date: new Date('2023-03-30 10:29:16.000000000 -05:00'),
    download: 'swift-5.8-RELEASE-windows10.exe',
    download_signature: 'swift-5.8-RELEASE-windows10.exe.sig',
    dir: 'swift-5.8-RELEASE',
    platform: 'ubuntu2204',
    branch: 'swift-5.8-release',
    windows: true
  }
  const visualStudio: vs.VisualStudio = {
    installationPath: path.join('C:', 'Visual Studio'),
    installationVersion: '16',
    catalog: {productDisplayVersion: '16'},
    properties: {
      setupEngineFilePath: path.join('C:', 'Visual Studio', 'setup.exe')
    }
  }

  beforeEach(() => {
    process.env = {...env}
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = env
  })

  it('tests download', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    expect(installer['version']).toStrictEqual(parseSemVer('5.8'))
    expect(installer['baseUrl']).toBe(
      'https://download.swift.org/swift-5.8-release/ubuntu2204/swift-5.8-RELEASE'
    )

    const download = path.resolve('tool', 'download', 'path')
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'rename').mockResolvedValue()
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([visualStudio]),
      stderr: ''
    })
    jest.spyOn(toolCache, 'downloadTool').mockResolvedValue(download)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    await expect(installer['download']()).resolves.toBe(`${download}.exe`)
    expect(installer['visualStudio']).toStrictEqual(visualStudio)
  })

  it('tests unpack', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    const exe = path.resolve('tool', 'downloaded', 'toolchain.exe')
    const extracted = path.resolve('tool', 'extracted', 'path')
    process.env.SystemDrive = 'C:'
    jest.spyOn(toolCache, 'extractTar').mockResolvedValue(extracted)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    const toolPath = path.join(process.env.SystemDrive, 'Library')
    await expect(installer['unpack'](exe)).resolves.toBe(toolPath)
  })

  it('tests add to PATH', async () => {
    const installer = new WindowsToolchainInstaller(toolchain)
    installer['visualStudio'] = visualStudio
    const installation = path.resolve('tool', 'installed', 'path')
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
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
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    const swiftDev = path.join(installation, 'Swift-development', 'bin')
    const icu67 = path.join(installation, 'icu-67', 'usr', 'bin')
    await installer['add'](installation)
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.PATH?.includes(swiftDev)).toBeTruthy()
    expect(process.env.PATH?.includes(icu67)).toBeTruthy()
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
