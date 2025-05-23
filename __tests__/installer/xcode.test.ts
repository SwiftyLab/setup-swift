import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as cache from '@actions/cache'
import * as toolCache from '@actions/tool-cache'
import {coerce as parseSemVer} from 'semver'
import * as plist from 'plist'
import {XcodeToolchainInstaller} from '../../src/installer/xcode'

jest.mock('plist')

describe('macOS toolchain installation verification', () => {
  const env = process.env
  const toolchain = {
    name: 'Xcode Swift 5.8.1',
    date: new Date('2023-05-31T18:30:00.000Z'),
    download: 'swift-5.8.1-RELEASE-osx.pkg',
    debug_info: 'swift-5.8.1-RELEASE-osx-symbols.pkg',
    dir: 'swift-5.8.1-RELEASE',
    xcode: '14.3.1',
    platform: 'xcode',
    branch: 'swift-5.8.1-release',
    xcodePath: '/Applications/Xcode_14.3.1.app',
    preventCaching: false
  }

  beforeEach(() => {
    process.env = {...env}
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = env
  })

  it('tests toolchain preinstalled', async () => {
    const installer = new XcodeToolchainInstaller(toolchain)
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: `swift-driver version: 1.75.2 Apple Swift version 5.8.1 (swiftlang-5.8.0.124.5 clang-1403.0.22.11.100)\nTarget: arm64-apple-macosx13.0`,
      stderr: ''
    })
    const installationNeededSpy = jest.spyOn(installer, 'isInstallationNeeded')
    const downloadSpy = jest.spyOn(toolCache, 'downloadTool')
    const extractSpy = jest.spyOn(toolCache, 'extractXar')
    await installer.install('x86_64')
    await installer.install('aarch64')
    for (const spy of [downloadSpy, extractSpy]) {
      expect(spy).not.toHaveBeenCalled()
    }
    expect(installationNeededSpy).toHaveBeenCalled()
    expect(process.env.DEVELOPER_DIR).toBe(toolchain.xcodePath)
  })

  it('tests toolchain preinstalled not preferred', async () => {
    const installer = new XcodeToolchainInstaller(toolchain)
    const identifier = 'org.swift.581202305171a'
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(cache, 'restoreCache').mockResolvedValue(undefined)
    jest.spyOn(toolCache, 'find').mockReturnValue('')
    jest.spyOn(cache, 'saveCache').mockResolvedValue(1)
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'readFile').mockResolvedValue('')
    jest.spyOn(fs, 'cp').mockResolvedValue()
    jest.spyOn(plist, 'parse').mockReturnValue({CFBundleIdentifier: identifier})
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: `swift-driver version: 1.75.2 Apple Swift version 5.8.1 (swiftlang-5.8.0.124.5 clang-1403.0.22.11.100)\nTarget: arm64-apple-macosx13.0`,
      stderr: ''
    })
    const download = path.resolve('tool', 'download', 'path')
    const extracted = path.resolve('tool', 'extracted', 'path')
    const deployed = path.resolve('tool', 'deployed', 'path')
    const cached = path.resolve('tool', 'cached', 'path')
    const installationNeededSpy = jest.spyOn(installer, 'isInstallationNeeded')
    const downloadSpy = jest
      .spyOn(toolCache, 'downloadTool')
      .mockResolvedValue(download)
    const extractXarSpy = jest
      .spyOn(toolCache, 'extractXar')
      .mockResolvedValue(extracted)
    const extractTarSpy = jest
      .spyOn(toolCache, 'extractTar')
      .mockResolvedValue(deployed)
    const cacheSpy = jest.spyOn(toolCache, 'cacheDir').mockResolvedValue(cached)
    await installer.install('x86_64')
    await installer.install('aarch64')
    for (const spy of [downloadSpy, extractXarSpy, extractTarSpy, cacheSpy]) {
      expect(spy).toHaveBeenCalled()
    }
    expect(installationNeededSpy).toHaveBeenCalled()
    expect(process.env.DEVELOPER_DIR).toBe(toolchain.xcodePath)
  })

  it('tests download', async () => {
    const installer = new XcodeToolchainInstaller(toolchain)
    expect(installer['version']).toStrictEqual(parseSemVer('5.8.1'))
    expect(installer['baseUrl'].href).toBe(
      'https://download.swift.org/swift-5.8.1-release/xcode/swift-5.8.1-RELEASE'
    )

    const download = path.resolve('tool', 'download', 'path')
    jest.spyOn(installer, 'isInstallationNeeded').mockResolvedValue(true)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(cache, 'restoreCache').mockResolvedValue(undefined)
    jest.spyOn(cache, 'saveCache').mockResolvedValue(1)
    jest.spyOn(toolCache, 'downloadTool').mockResolvedValue(download)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    await expect(installer['download']('x86_64')).resolves.toBe(download)
  })

  it('tests unpack', async () => {
    const installer = new XcodeToolchainInstaller(toolchain)
    const download = path.resolve('tool', 'download', 'path')
    const extracted = path.resolve('tool', 'extracted', 'path')
    const deployed = path.resolve('tool', 'deployed', 'path')
    jest.spyOn(toolCache, 'extractXar').mockResolvedValue(extracted)
    jest.spyOn(toolCache, 'extractTar').mockResolvedValue(deployed)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    await expect(installer['unpack'](download, 'x86_64')).resolves.toBe(
      deployed
    )
  })

  it('tests add to PATH', async () => {
    const installer = new XcodeToolchainInstaller(toolchain)
    const deployed = path.resolve('tool', 'deployed', 'path')
    const identifier = 'org.swift.581202305171a'
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'readFile').mockResolvedValue('')
    jest.spyOn(plist, 'parse').mockReturnValue({CFBundleIdentifier: identifier})
    const swiftPath = path.join(deployed, 'usr', 'bin')
    await installer['add'](deployed, 'x86_64')
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.TOOLCHAINS).toBe(identifier)
  })

  it.each(['aarch64', 'x86_64'])(
    'tests installation with download for %s',
    async arch => {
      const installer = new XcodeToolchainInstaller(toolchain)
      const download = path.resolve('tool', 'download', 'path')
      const extracted = path.resolve('tool', 'extracted', 'path')
      const deployed = path.resolve('tool', 'deployed', 'path')
      const cached = path.resolve('tool', 'cached', 'path')
      const swiftPath = path.join(cached, 'usr', 'bin')
      const identifier = 'org.swift.581202305171a'
      jest.spyOn(installer, 'isInstallationNeeded').mockResolvedValue(true)
      jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
      jest.spyOn(cache, 'restoreCache').mockResolvedValue(undefined)
      jest.spyOn(toolCache, 'find').mockReturnValue('')
      jest.spyOn(exec, 'exec').mockResolvedValue(0)
      jest.spyOn(fs, 'cp').mockResolvedValue()
      const downloadSpy = jest.spyOn(toolCache, 'downloadTool')
      downloadSpy.mockResolvedValue(download)
      const extractSpy = jest.spyOn(toolCache, 'extractXar')
      extractSpy.mockResolvedValue(extracted)
      const deploySpy = jest.spyOn(toolCache, 'extractTar')
      deploySpy.mockResolvedValue(deployed)
      const toolCacheSpy = jest.spyOn(toolCache, 'cacheDir')
      toolCacheSpy.mockResolvedValue(cached)
      const actionCacheSpy = jest.spyOn(cache, 'saveCache')
      actionCacheSpy.mockResolvedValue(1)
      jest.spyOn(fs, 'access').mockResolvedValue()
      jest.spyOn(fs, 'readFile').mockResolvedValue('')
      jest
        .spyOn(plist, 'parse')
        .mockReturnValue({CFBundleIdentifier: identifier})
      await installer.install(arch)
      expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
      expect(process.env.TOOLCHAINS).toBe(identifier)
      for (const spy of [
        downloadSpy,
        extractSpy,
        deploySpy,
        toolCacheSpy,
        actionCacheSpy
      ]) {
        expect(spy).toHaveBeenCalled()
      }
      const toolCacheKey = `${toolchain.dir}-${toolchain.platform}`
      const actionCacheKey = `${toolCacheKey}-${arch}`
      expect(toolCacheSpy.mock.calls[0]?.[0]).toBe(deployed)
      expect(toolCacheSpy.mock.calls[0]?.[1]).toBe(toolCacheKey)
      expect(toolCacheSpy.mock.calls[0]?.[2]).toBe('5.8.1')
      expect(toolCacheSpy.mock.calls[0]?.[3]).toBe(arch)
      expect(actionCacheSpy.mock.calls[0]?.[1]).toBe(actionCacheKey)
    }
  )

  it('tests installation with cache', async () => {
    const installer = new XcodeToolchainInstaller(toolchain)
    const cached = path.resolve('tool', 'cached', 'path')
    const swiftPath = path.join(cached, 'usr', 'bin')
    const identifier = 'org.swift.581202305171a'
    jest.spyOn(toolCache, 'find').mockReturnValue(cached)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(cache, 'saveCache').mockResolvedValue(1)
    const downloadSpy = jest.spyOn(toolCache, 'downloadTool')
    const extractSpy = jest.spyOn(toolCache, 'extractXar')
    const deploySpy = jest.spyOn(toolCache, 'extractTar')
    jest.spyOn(toolCache, 'cacheDir').mockResolvedValue(cached)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: `Apple Swift version 5.9-dev (LLVM fd38736063c15cd, Swift a533c63d783f5b8)\nTarget: arm64-apple-macosx13.0`,
      stderr: ''
    })
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'readFile').mockResolvedValue('')
    jest.spyOn(plist, 'parse').mockReturnValue({CFBundleIdentifier: identifier})
    await installer.install('aarch64')
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(process.env.TOOLCHAINS).toBe(identifier)
    for (const spy of [downloadSpy, extractSpy, deploySpy]) {
      expect(spy).not.toHaveBeenCalled()
    }
  })

  it('tests installation with preinstalled toolchain', async () => {
    const installer = new XcodeToolchainInstaller(toolchain)
    jest.spyOn(toolCache, 'find').mockReturnValue('')
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: `swift-driver version: 1.75.2 Apple Swift version 5.8.1 (swiftlang-5.8.0.124.5 clang-1403.0.22.11.100)\nTarget: arm64-apple-macosx13.0`,
      stderr: ''
    })
    await expect(installer.install('aarch64')).resolves
    expect(process.env.DEVELOPER_DIR).toBe(toolchain.xcodePath)
  })

  it('tests installed swift version detection', async () => {
    const installer = new XcodeToolchainInstaller(toolchain)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: `swift-driver version: 1.75.2 Apple Swift version 5.8.1 (swiftlang-5.8.0.124.5 clang-1403.0.22.11.100)\nTarget: arm64-apple-macosx13.0`,
      stderr: ''
    })
    const version = await installer.installedSwiftVersion()
    expect(version).toBe('5.8.1')

    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: `Apple Swift version 5.9-dev (LLVM fd38736063c15cd, Swift a533c63d783f5b8)\nTarget: arm64-apple-macosx13.0`,
      stderr: ''
    })
    const devVersion = await installer.installedSwiftVersion()
    expect(devVersion).toBe('5.9-dev')
  })
})
