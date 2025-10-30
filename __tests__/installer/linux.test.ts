import os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
// @ts-ignore
import {__setos as setos} from 'getos'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as cache from '@actions/cache'
import * as toolCache from '@actions/tool-cache'
import {coerce as parseSemVer} from 'semver'
import {LinuxToolchainInstaller} from '../../src/installer/linux'
import {ToolchainVersion} from '../../src/version'
import {Platform} from '../../src/platform'

jest.mock('getos')

describe('linux toolchain installation verification', () => {
  const env = process.env
  const toolchain = {
    name: 'Ubuntu 22.04',
    date: new Date('2023-03-30 10:28:49.000000000 -05:00'),
    download: 'swift-5.8-RELEASE-ubuntu22.04.tar.gz',
    download_signature: 'swift-5.8-RELEASE-ubuntu22.04.tar.gz.sig',
    dir: 'swift-5.8-RELEASE',
    docker: '5.8-jammy',
    platform: 'ubuntu2204',
    branch: 'swift-5.8-release',
    preventCaching: false
  }

  beforeEach(() => {
    process.env = {...env}
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = env
  })

  it('tests download', async () => {
    const installer = new LinuxToolchainInstaller(toolchain)
    expect(installer['version']).toStrictEqual(parseSemVer('5.8'))
    expect(installer['baseUrl'].href).toBe(
      'https://download.swift.org/swift-5.8-release/ubuntu2204/swift-5.8-RELEASE'
    )

    const download = path.resolve('tool', 'download', 'path')
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(cache, 'restoreCache').mockResolvedValue(undefined)
    jest.spyOn(cache, 'saveCache').mockResolvedValue(1)
    jest.spyOn(toolCache, 'downloadTool').mockResolvedValue(download)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    await expect(installer['download']('x86_64')).resolves.toBe(download)
  })

  it('tests unpack', async () => {
    const installer = new LinuxToolchainInstaller(toolchain)
    const download = path.resolve('tool', 'download', 'path')
    const extracted = path.resolve('tool', 'extracted', 'path')
    jest.spyOn(toolCache, 'extractTar').mockResolvedValue(extracted)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    const toolPath = path.join(extracted, 'swift-5.8-RELEASE-ubuntu22.04')
    await expect(installer['unpack'](download)).resolves.toBe(toolPath)
  })

  it('tests add to PATH', async () => {
    const installer = new LinuxToolchainInstaller(toolchain)
    const extracted = path.resolve('tool', 'extracted', 'path')
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    const toolPath = path.join(extracted, 'swift-5.8-RELEASE-ubuntu22.04')
    const swiftPath = path.join(toolPath, 'usr', 'bin')
    await installer['add'](toolPath)
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
  })

  it.each(['aarch64', 'x86_64'])(
    'tests installation with download for arch %s',
    async arch => {
      const installer = new LinuxToolchainInstaller(toolchain)
      const download = path.resolve('tool', 'download', 'path')
      const extracted = path.resolve('tool', 'extracted', 'path')
      const cached = path.resolve('tool', 'cached', 'path')
      const swiftPath = path.join(cached, 'usr', 'bin')
      jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
      jest.spyOn(cache, 'restoreCache').mockResolvedValue(undefined)
      jest.spyOn(toolCache, 'find').mockReturnValue('')
      jest.spyOn(fs, 'cp').mockResolvedValue()
      const downloadSpy = jest.spyOn(toolCache, 'downloadTool')
      downloadSpy.mockResolvedValue(download)
      const extractSpy = jest.spyOn(toolCache, 'extractTar')
      extractSpy.mockResolvedValue(extracted)
      const toolCacheSpy = jest.spyOn(toolCache, 'cacheDir')
      toolCacheSpy.mockResolvedValue(cached)
      const actionCacheSpy = jest.spyOn(cache, 'saveCache')
      actionCacheSpy.mockResolvedValue(1)
      jest.spyOn(exec, 'exec').mockResolvedValue(0)
      await installer.install(arch)
      expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
      for (const spy of [
        downloadSpy,
        extractSpy,
        toolCacheSpy,
        actionCacheSpy
      ]) {
        expect(spy).toHaveBeenCalled()
      }
      const toolCacheKey = `${toolchain.dir}-${toolchain.platform}`
      const actionCacheKey = `${toolCacheKey}-${arch}`
      const toolDir = path.basename(toolchain.download, '.tar.gz')
      const cachedTool = path.join(extracted, toolDir)
      expect(toolCacheSpy.mock.calls[0]?.[0]).toBe(cachedTool)
      expect(toolCacheSpy.mock.calls[0]?.[1]).toBe(toolCacheKey)
      expect(toolCacheSpy.mock.calls[0]?.[2]).toBe('5.8.0')
      expect(toolCacheSpy.mock.calls[0]?.[3]).toBe(arch)
      expect(actionCacheSpy.mock.calls[0]?.[1]).toBe(actionCacheKey)
    }
  )

  it('tests installation with action cache', async () => {
    const installer = new LinuxToolchainInstaller(toolchain)
    const cached = path.resolve('tool', 'cached', 'path')
    const swiftPath = path.join(cached, 'usr', 'bin')
    jest.spyOn(toolCache, 'find').mockReturnValue('')
    jest.spyOn(cache, 'restoreCache').mockResolvedValue(cached)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    const downloadSpy = jest.spyOn(toolCache, 'downloadTool')
    const extractSpy = jest.spyOn(toolCache, 'extractTar')
    const toolCacheSpy = jest.spyOn(toolCache, 'cacheDir')
    const actionCacheSpy = jest.spyOn(cache, 'saveCache')
    toolCacheSpy.mockResolvedValue(cached)
    await installer.install('aarch64')
    const toolCacheKey = `${toolchain.dir}-${toolchain.platform}`
    const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()
    const restore = path.join(tmpDir, 'setup-swift', toolCacheKey)
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    expect(toolCacheSpy.mock.calls[0]?.[0]).toBe(restore)
    expect(toolCacheSpy.mock.calls[0]?.[1]).toBe(toolCacheKey)
    expect(toolCacheSpy.mock.calls[0]?.[2]).toBe('5.8.0')
    for (const spy of [downloadSpy, extractSpy, actionCacheSpy]) {
      expect(spy).not.toHaveBeenCalled()
    }
  })

  it('tests installation with tool cache', async () => {
    const installer = new LinuxToolchainInstaller(toolchain)
    const cached = path.resolve('tool', 'cached', 'path')
    const swiftPath = path.join(cached, 'usr', 'bin')
    jest.spyOn(toolCache, 'find').mockReturnValue(cached)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    const downloadSpy = jest.spyOn(toolCache, 'downloadTool')
    const extractSpy = jest.spyOn(toolCache, 'extractTar')
    const toolCacheSpy = jest.spyOn(toolCache, 'cacheDir')
    const actionCacheSpy = jest.spyOn(cache, 'saveCache')
    await installer.install('aarch64')
    expect(process.env.PATH?.includes(swiftPath)).toBeTruthy()
    for (const spy of [downloadSpy, extractSpy, toolCacheSpy, actionCacheSpy]) {
      expect(spy).not.toHaveBeenCalled()
    }
  })

  it('tests installed swift version detection', async () => {
    const installer = new LinuxToolchainInstaller(toolchain)
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

  it('tests custom swift tool caching', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '22.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const swiftwasm = 'https://github.com/swiftwasm/swift/releases/download'
    const name = 'swift-wasm-5.10-SNAPSHOT-2024-03-30-a'
    const resource = `${name}-ubuntu22.04_x86_64.tar.gz`
    const toolchainUrl = `${swiftwasm}/${name}/${resource}`
    const cVer = ToolchainVersion.create(toolchainUrl, false)
    const download = path.resolve('tool', 'download', 'path')
    const extracted = path.resolve('tool', 'extracted', 'path')
    const cached = path.resolve('tool', 'cached', 'path')
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(cache, 'restoreCache').mockResolvedValue(undefined)
    jest.spyOn(toolCache, 'find').mockReturnValue('')
    jest.spyOn(fs, 'cp').mockResolvedValue()
    jest.spyOn(toolCache, 'downloadTool').mockResolvedValue(download)
    jest.spyOn(toolCache, 'extractTar').mockResolvedValue(extracted)
    jest.spyOn(toolCache, 'cacheDir').mockResolvedValue(cached)
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    const cacheSpy = jest.spyOn(cache, 'saveCache')
    const {installer} = await Platform.install(cVer)
    expect(cacheSpy).not.toHaveBeenCalled()
    expect(installer.data.baseUrl?.href).toBe(path.posix.dirname(toolchainUrl))
    expect(installer.data.preventCaching).toBe(true)
    expect(installer.data.name).toBe('Swift Custom Snapshot')
    expect(installer.data.platform).toBe('ubuntu2204')
    expect(installer.data.download).toBe(resource)
    expect(installer.data.dir).toBe(name)
    expect(installer.data.branch).toBe('swiftwasm')
  })
})
