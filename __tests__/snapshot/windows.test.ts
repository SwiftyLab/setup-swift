import os from 'os'
import {posix} from 'path'
// @ts-ignore
import {__setos as setos} from 'getos'
import {ToolchainVersion} from '../../src/version'
import {Platform} from '../../src/platform'
import {WindowsToolchainSnapshot} from '../../src/snapshot'

jest.mock('getos')

describe('fetch windows tool data based on options', () => {
  const ver5 = ToolchainVersion.create('5', false)
  const ver5_0 = ToolchainVersion.create('5.0', false)
  const ver5_5_0 = ToolchainVersion.create('5.5.0', false)
  const ver5_5 = ToolchainVersion.create('5.5', false)
  const dev5_5 = ToolchainVersion.create('5.5', true)
  const latest = ToolchainVersion.create('latest', false)
  const latestDev = ToolchainVersion.create('latest', true)

  it('fetches windows 10 latest swift 5 tool', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5)
    expect(tool).toBeTruthy()
    const wTool = tool as WindowsToolchainSnapshot
    expect(wTool.download).toBeTruthy()
    expect(wTool.dir).toBeTruthy()
    expect(wTool.platform).toBe('windows10')
    expect(wTool.branch).toBeTruthy()
    expect(wTool.download_signature).toBeTruthy()
    expect(wTool.preventCaching).toBe(false)
  })

  it('fetches windows 10 latest swift 5.0 tool', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5_0)
    expect(tool).toBeUndefined()
  })

  it('fetches windows 10 latest swift 5.5.0 tool', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5_5_0)
    expect(tool).toBeTruthy()
    const wTool = tool as WindowsToolchainSnapshot
    expect(wTool.download).toBe('swift-5.5-RELEASE-windows10.exe')
    expect(wTool.dir).toBe('swift-5.5-RELEASE')
    expect(wTool.platform).toBe('windows10')
    expect(wTool.branch).toBe('swift-5.5-release')
    expect(wTool.download_signature).toBe('swift-5.5-RELEASE-windows10.exe.sig')
    expect(wTool.preventCaching).toBe(false)
  })

  it('fetches windows 10 latest swift 5.5 tool', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5_5)
    expect(tool).toBeTruthy()
    const wTool = tool as WindowsToolchainSnapshot
    expect(wTool.download).toBe('swift-5.5.3-RELEASE-windows10.exe')
    expect(wTool.dir).toBe('swift-5.5.3-RELEASE')
    expect(wTool.platform).toBe('windows10')
    expect(wTool.branch).toBe('swift-5.5.3-release')
    expect(wTool.download_signature).toBe(
      'swift-5.5.3-RELEASE-windows10.exe.sig'
    )
    expect(wTool.preventCaching).toBe(false)
  })

  it('fetches windows 10 latest swift 5.5 tool including dev snapshot', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(dev5_5)
    expect(tool).toBeTruthy()
    const wTool = tool as WindowsToolchainSnapshot
    expect(wTool.download).toBe('swift-5.5.3-RELEASE-windows10.exe')
    expect(wTool.dir).toBe('swift-5.5.3-RELEASE')
    expect(wTool.platform).toBe('windows10')
    expect(wTool.branch).toBe('swift-5.5.3-release')
    expect(wTool.download_signature).toBe(
      'swift-5.5.3-RELEASE-windows10.exe.sig'
    )
    expect(wTool.preventCaching).toBe(false)
  })

  it('fetches windows 10 latest swift tool', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(latest)
    expect(tool).toBeTruthy()
    const wTool = tool as WindowsToolchainSnapshot
    expect(wTool.windows).toBe(true)
    expect(wTool.download).toBeTruthy()
    expect(wTool.dir).toBeTruthy()
    expect(wTool.platform).toBeTruthy()
    expect(wTool.branch).toBeTruthy()
    expect(wTool.download_signature).toBeTruthy()
    expect(wTool.preventCaching).toBe(false)
  })

  it('fetches windows 10 latest swift tool including dev snapshot', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(latestDev)
    expect(tool).toBeTruthy()
    const wTool = tool as WindowsToolchainSnapshot
    expect(wTool.download).toBeTruthy()
    expect(wTool.dir).toBeTruthy()
    expect(wTool.platform).toBeTruthy()
    expect(wTool.branch).toBeTruthy()
    expect(wTool.preventCaching).toBe(false)
  })

  it('fetches windows 10 named swift tool', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const name = 'swift-DEVELOPMENT-SNAPSHOT-2023-08-10-a'
    const version = ToolchainVersion.create(name, false)
    const tool = await Platform.toolchain(version)
    expect(tool).toBeTruthy()
    const wTool = tool as WindowsToolchainSnapshot
    expect(wTool.download).toBe(
      'swift-DEVELOPMENT-SNAPSHOT-2023-08-10-a-windows10.exe'
    )
    expect(wTool.dir).toBe('swift-DEVELOPMENT-SNAPSHOT-2023-08-10-a')
    expect(wTool.platform).toBe('windows10')
    expect(wTool.branch).toBe('development')
    expect(wTool.download_signature).toBe(
      'swift-DEVELOPMENT-SNAPSHOT-2023-08-10-a-windows10.exe.sig'
    )
    expect(wTool.preventCaching).toBe(false)
  })

  it('fetches windows 10 named versioned swift tool', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const name = 'swift-5.9-DEVELOPMENT-SNAPSHOT-2023-05-11-a'
    const version = ToolchainVersion.create(name, false)
    const tool = await Platform.toolchain(version)
    expect(tool).toBeTruthy()
    const wTool = tool as WindowsToolchainSnapshot
    expect(wTool.download).toBe(
      'swift-5.9-DEVELOPMENT-SNAPSHOT-2023-05-11-a-windows10.exe'
    )
    expect(wTool.dir).toBe('swift-5.9-DEVELOPMENT-SNAPSHOT-2023-05-11-a')
    expect(wTool.platform).toBe('windows10')
    expect(wTool.branch).toBe('swift-5.9-branch')
    expect(wTool.download_signature).toBe(
      'swift-5.9-DEVELOPMENT-SNAPSHOT-2023-05-11-a-windows10.exe.sig'
    )
    expect(wTool.preventCaching).toBe(false)
  })

  it('fetches windows 10 latest swift 5.5 tools', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(ver5_5)
    expect(tools.length).toBe(4)
  })

  it('fetches windows 10 latest swift 5.5 tools including dev snapshot', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(dev5_5)
    expect(tools.length).toBe(34)
  })

  it('fetches windows 10 custom swift tools', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const swiftwasm = 'https://github.com/swiftwasm/swift/releases/download'
    const name = 'swift-wasm-5.10-SNAPSHOT-2024-03-30-a'
    const resource = `${name}-windows10.exe`
    const toolchainUrl = `${swiftwasm}/${name}/${resource}`
    const cVer = ToolchainVersion.create(toolchainUrl, false)
    const tools = await Platform.toolchains(cVer)
    expect(tools.length).toBe(1)
    const tool = tools[0]
    expect(tool.baseUrl?.href).toBe(posix.dirname(toolchainUrl))
    expect(tool.preventCaching).toBe(true)
    expect(tool.name).toBe('Swift Custom Snapshot')
    expect(tool.platform).toBe('windows10')
    expect(tool.download).toBe(resource)
    expect(tool.dir).toBe(name)
    expect(tool.branch).toBe('swiftwasm')
  })
})
