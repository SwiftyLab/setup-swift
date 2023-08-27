import os from 'os'
// @ts-ignore
import {__setos as setos} from 'getos'
import {ToolchainVersion} from '../../src/version'
import {Platform} from '../../src/platform'
import {LinuxToolchainSnapshot} from '../../src/snapshot'

jest.mock('getos')

describe('fetch linux tool data based on options', () => {
  const ver4 = ToolchainVersion.create('4', false)
  const ver5_0 = ToolchainVersion.create('5.0', false)
  const ver5_5_0 = ToolchainVersion.create('5.5.0', false)
  const ver5_5 = ToolchainVersion.create('5.5', false)
  const dev5_5 = ToolchainVersion.create('5.5', true)
  const latest = ToolchainVersion.create('latest', false)
  const latestDev = ToolchainVersion.create('latest', true)

  it('fetches ubuntu 18.04 latest swift 4 tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver4)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe('swift-4.2.4-RELEASE-ubuntu18.04.tar.gz')
    expect(lTool.dir).toBe('swift-4.2.4-RELEASE')
    expect(lTool.platform).toBe('ubuntu1804')
    expect(lTool.branch).toBe('swift-4.2.4-release')
    expect(lTool.download_signature).toBe(
      'swift-4.2.4-RELEASE-ubuntu18.04.tar.gz.sig'
    )
    expect(lTool.docker).toBeUndefined()
  })

  it('fetches ubuntu 18.04 latest swift 5.0 tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5_0)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe('swift-5.0.3-RELEASE-ubuntu18.04.tar.gz')
    expect(lTool.dir).toBe('swift-5.0.3-RELEASE')
    expect(lTool.platform).toBe('ubuntu1804')
    expect(lTool.branch).toBe('swift-5.0.3-release')
    expect(lTool.download_signature).toBe(
      'swift-5.0.3-RELEASE-ubuntu18.04.tar.gz.sig'
    )
    expect(lTool.docker).toBe('5.0.3-bionic')
  })

  it('fetches ubuntu 18.04 latest swift 5.5.0 tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5_5_0)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe('swift-5.5-RELEASE-ubuntu18.04.tar.gz')
    expect(lTool.dir).toBe('swift-5.5-RELEASE')
    expect(lTool.platform).toBe('ubuntu1804')
    expect(lTool.branch).toBe('swift-5.5-release')
    expect(lTool.download_signature).toBe(
      'swift-5.5-RELEASE-ubuntu18.04.tar.gz.sig'
    )
    expect(lTool.docker).toBe('5.5-bionic')
  })

  it('fetches ubuntu 18.04 latest swift 5.5 tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5_5)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe('swift-5.5.3-RELEASE-ubuntu18.04.tar.gz')
    expect(lTool.dir).toBe('swift-5.5.3-RELEASE')
    expect(lTool.platform).toBe('ubuntu1804')
    expect(lTool.branch).toBe('swift-5.5.3-release')
    expect(lTool.download_signature).toBe(
      'swift-5.5.3-RELEASE-ubuntu18.04.tar.gz.sig'
    )
    expect(lTool.docker).toBe('5.5.3-bionic')
  })

  it('fetches ubuntu 18.04 latest swift 5.5 tool including dev snapshot', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(dev5_5)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe('swift-5.5.3-RELEASE-ubuntu18.04.tar.gz')
    expect(lTool.dir).toBe('swift-5.5.3-RELEASE')
    expect(lTool.platform).toBe('ubuntu1804')
    expect(lTool.branch).toBe('swift-5.5.3-release')
    expect(lTool.download_signature).toBe(
      'swift-5.5.3-RELEASE-ubuntu18.04.tar.gz.sig'
    )
    expect(lTool.docker).toBe('5.5.3-bionic')
  })

  it('fetches ubuntu 18.04 latest swift tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(latest)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBeTruthy()
    expect(lTool.dir).toBeTruthy()
    expect(lTool.platform).toBeTruthy()
    expect(lTool.branch).toBeTruthy()
    expect(lTool.download_signature).toBeTruthy()
    expect(lTool.docker).toBeTruthy()
  })

  it('fetches ubuntu 18.04 latest swift tool including dev snapshot', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(latestDev)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBeTruthy()
    expect(lTool.dir).toBeTruthy()
    expect(lTool.platform).toBeTruthy()
    expect(lTool.branch).toBeTruthy()
    expect(lTool.download_signature).toBeTruthy()
    expect(lTool.docker).toBeTruthy()
  })

  it('handles swift tool version not present by returning undefined', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const maxVer = ToolchainVersion.create(`${Number.MAX_VALUE}`, false)
    const tool = await Platform.toolchain(maxVer)
    expect(tool).toBeUndefined()
  })

  it('fetches ubuntu 16.04 latest swift 5.6 tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '16.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const ver5_6_1 = ToolchainVersion.create('5.6.1', false)
    const tool = await Platform.toolchain(ver5_6_1)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe('swift-5.6.1-RELEASE-ubuntu20.04.tar.gz')
    expect(lTool.dir).toBe('swift-5.6.1-RELEASE')
    expect(lTool.platform).toBe('ubuntu2004')
    expect(lTool.branch).toBe('swift-5.6.1-release')
    expect(lTool.download_signature).toBe(
      'swift-5.6.1-RELEASE-ubuntu20.04.tar.gz.sig'
    )
    expect(lTool.docker).toBe('5.6.1-focal')
  })

  it('fetches ubuntu 20.04 latest swift 5.2 tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '20.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const ver5_2 = ToolchainVersion.create('5.2', false)
    const tool = await Platform.toolchain(ver5_2)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe('swift-5.2.5-RELEASE-ubuntu20.04.tar.gz')
    expect(lTool.dir).toBe('swift-5.2.5-RELEASE')
    expect(lTool.platform).toBe('ubuntu2004')
    expect(lTool.branch).toBe('swift-5.2.5-release')
    expect(lTool.download_signature).toBe(
      'swift-5.2.5-RELEASE-ubuntu20.04.tar.gz.sig'
    )
    expect(lTool.docker).toBe('5.2.5-focal')
  })

  it('fetches centos 7 latest swift tool', async () => {
    setos({os: 'linux', dist: 'CentOS', release: '7'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(latest)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBeTruthy()
    expect(lTool.dir).toBeTruthy()
    expect(lTool.platform).toBeTruthy()
    expect(lTool.branch).toBeTruthy()
    expect(lTool.download_signature).toBeTruthy()
    expect(lTool.docker).toBeTruthy()
  })

  it('fetches ubuntu 18.04 latest swift 5.5 tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(ver5_5)
    expect(tools.length).toBe(4)
  })

  it('fetches ubuntu 18.04 latest swift 5.5 tools including dev snapshot', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(dev5_5)
    expect(tools.length).toBe(103)
  })

  it('fetches ubuntu 16.04 latest swift 5.6 tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '16.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const ver5_6_1 = ToolchainVersion.create('5.6.1', false)
    const tools = await Platform.toolchains(ver5_6_1)
    expect(tools.length).toBe(2)
  })

  it('fetches ubuntu 20.04 latest swift 5.2 tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '20.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const ver5_2 = ToolchainVersion.create('5.2', false)
    const tools = await Platform.toolchains(ver5_2)
    expect(tools.length).toBe(2)
  })
})
