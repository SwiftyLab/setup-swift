import os from 'os'
import {glob} from 'glob'
// @ts-ignore
import {__setos as setos} from 'getos'
import {ToolchainVersion} from '../src/version'
import {Platform} from '../src/platform'
import {
  LinuxToolchainSnapshot,
  XcodeToolchainSnapshot,
  WindowsToolchainSnapshot
} from '../src/snapshot'

jest.mock('getos')

describe('fetch tool data based on options', () => {
  const ver4 = ToolchainVersion.create('4', false)
  const ver5 = ToolchainVersion.create('5', false)
  const ver5_0 = ToolchainVersion.create('5.0', false)
  const ver5_5_0 = ToolchainVersion.create('5.5.0', false)
  const ver5_5 = ToolchainVersion.create('5.5', false)
  const dev5_5 = ToolchainVersion.create('5.5', true)
  const latest = ToolchainVersion.create('latest', false)
  const latestDev = ToolchainVersion.create('latest', true)

  // MacOs tests

  it('fetches macOS latest swift 4 tool', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver4)
    expect(tool).toBeTruthy()
    const xTool = tool as XcodeToolchainSnapshot
    expect(xTool.download).toBe('swift-4.2.4-RELEASE-osx.pkg')
    expect(xTool.dir).toBe('swift-4.2.4-RELEASE')
    expect(xTool.platform).toBe('xcode')
    expect(xTool.branch).toBe('swift-4.2.4-release')
    expect(xTool.xcode).toBe('10.1')
  })

  it('fetches macOS latest swift 5.0 tool', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5_0)
    expect(tool).toBeTruthy()
    const xTool = tool as XcodeToolchainSnapshot
    expect(xTool.download).toBe('swift-5.0.3-RELEASE-osx.pkg')
    expect(xTool.dir).toBe('swift-5.0.3-RELEASE')
    expect(xTool.platform).toBe('xcode')
    expect(xTool.branch).toBe('swift-5.0.3-release')
    expect(xTool.xcode).toBe('10.2.1')
  })

  it('fetches macOS latest swift 5.5.0 tool', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5_5_0)
    expect(tool).toBeTruthy()
    const xTool = tool as XcodeToolchainSnapshot
    expect(xTool.download).toBe('swift-5.5-RELEASE-osx.pkg')
    expect(xTool.dir).toBe('swift-5.5-RELEASE')
    expect(xTool.platform).toBe('xcode')
    expect(xTool.branch).toBe('swift-5.5-release')
    expect(xTool.xcode).toBe('13')
  })

  it('fetches macOS latest swift 5.5 tool', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(ver5_5)
    expect(tool).toBeTruthy()
    const xTool = tool as XcodeToolchainSnapshot
    expect(xTool.download).toBe('swift-5.5.3-RELEASE-osx.pkg')
    expect(xTool.dir).toBe('swift-5.5.3-RELEASE')
    expect(xTool.platform).toBe('xcode')
    expect(xTool.branch).toBe('swift-5.5.3-release')
    expect(xTool.xcode).toBe('13.2')
  })

  it('fetches macOS latest swift 5.5 tool including dev snapshot', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(dev5_5)
    expect(tool).toBeTruthy()
    const xTool = tool as XcodeToolchainSnapshot
    expect(xTool.download).toBe('swift-5.5.3-RELEASE-osx.pkg')
    expect(xTool.dir).toBe('swift-5.5.3-RELEASE')
    expect(xTool.platform).toBe('xcode')
    expect(xTool.branch).toBe('swift-5.5.3-release')
    expect(xTool.xcode).toBe('13.2')
  })

  it('fetches macOS latest swift tool', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(latest)
    expect(tool).toBeTruthy()
    const xTool = tool as XcodeToolchainSnapshot
    expect(xTool.download).toBeTruthy()
    expect(xTool.dir).toBeTruthy()
    expect(xTool.platform).toBeTruthy()
    expect(xTool.branch).toBeTruthy()
    expect(xTool.xcode).toBeTruthy()
  })

  it('fetches macOS latest swift tool including dev snapshot', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tool = await Platform.toolchain(latestDev)
    expect(tool).toBeTruthy()
    const xTool = tool as XcodeToolchainSnapshot
    expect(xTool.download).toBeTruthy()
    expect(xTool.dir).toBeTruthy()
    expect(xTool.platform).toBeTruthy()
    expect(xTool.branch).toBeTruthy()
  })

  it('fetches macOS latest swift beta version tool', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const branches = await glob(`swiftorg/_data/builds/swift-*`)

    function getVersions(folders: string[], suffix: string) {
      return folders.flatMap(folder => {
        const match = folder.match(`swift-([0-9_]+)-${suffix}`)
        if (match?.length) {
          return match[1]
        }
        return []
      })
    }

    const stableVersions = getVersions(branches, 'release')
    const betaVersions = getVersions(branches, 'branch').filter(
      v => !stableVersions.includes(v)
    )
    if (betaVersions?.length) {
      const betaVersion = betaVersions[betaVersions.length - 1].replaceAll(
        '_',
        '.'
      )
      const tool = await Platform.toolchain(
        ToolchainVersion.create(betaVersion, false)
      )
      expect(tool).toBeTruthy()
    }
  })

  // Linux tests

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

  // Windows tests

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
    expect(wTool.download_signature).toBeTruthy()
  })
})
