import os from 'os'
import {posix} from 'path'
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
    expect(lTool.preventCaching).toBe(false)
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
    expect(lTool.preventCaching).toBe(false)
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
    expect(lTool.preventCaching).toBe(false)
  })

  it('fetches ubuntu 20.04 arm64 latest swift 5.6.0 tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '20.04'})
    jest.spyOn(os, 'arch').mockReturnValue('arm64')
    const ver5_6_0 = ToolchainVersion.create('5.6.0', false)
    const tool = await Platform.toolchain(ver5_6_0)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe('swift-5.6-RELEASE-ubuntu20.04-aarch64.tar.gz')
    expect(lTool.dir).toBe('swift-5.6-RELEASE')
    expect(lTool.platform).toBe('ubuntu2004-aarch64')
    expect(lTool.branch).toBe('swift-5.6-release')
    expect(lTool.download_signature).toBe(
      'swift-5.6-RELEASE-ubuntu20.04-aarch64.tar.gz.sig'
    )
    expect(lTool.docker).toBe('5.6-focal')
    expect(lTool.preventCaching).toBe(false)
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
    expect(lTool.preventCaching).toBe(false)
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
    expect(lTool.preventCaching).toBe(false)
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
    expect(lTool.preventCaching).toBe(false)
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
    expect(lTool.preventCaching).toBe(false)
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
    expect(lTool.preventCaching).toBe(false)
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
    expect(lTool.preventCaching).toBe(false)
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
    expect(lTool.preventCaching).toBe(false)
  })

  it('fetches ubuntu 22.04 named swift tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '22.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const name = 'swift-DEVELOPMENT-SNAPSHOT-2023-09-02-a'
    const version = ToolchainVersion.create(name, false)
    const tool = await Platform.toolchain(version)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe(
      'swift-DEVELOPMENT-SNAPSHOT-2023-09-02-a-ubuntu22.04.tar.gz'
    )
    expect(lTool.dir).toBe('swift-DEVELOPMENT-SNAPSHOT-2023-09-02-a')
    expect(lTool.platform).toBe('ubuntu2204')
    expect(lTool.branch).toBe('development')
    expect(lTool.download_signature).toBe(
      'swift-DEVELOPMENT-SNAPSHOT-2023-09-02-a-ubuntu22.04.tar.gz.sig'
    )
    expect(lTool.preventCaching).toBe(false)
  })

  it('fetches ubuntu 22.04 named versioned swift tool', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '22.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const name = 'swift-5.9-DEVELOPMENT-SNAPSHOT-2023-09-01-a'
    const version = ToolchainVersion.create(name, false)
    const tool = await Platform.toolchain(version)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe(
      'swift-5.9-DEVELOPMENT-SNAPSHOT-2023-09-01-a-ubuntu22.04.tar.gz'
    )
    expect(lTool.dir).toBe('swift-5.9-DEVELOPMENT-SNAPSHOT-2023-09-01-a')
    expect(lTool.platform).toBe('ubuntu2204')
    expect(lTool.branch).toBe('swift-5.9-branch')
    expect(lTool.download_signature).toBe(
      'swift-5.9-DEVELOPMENT-SNAPSHOT-2023-09-01-a-ubuntu22.04.tar.gz.sig'
    )
    expect(lTool.preventCaching).toBe(false)
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

  it('fetches ubuntu 16.04 latest swift 5.6.1 tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '16.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const ver5_6_1 = ToolchainVersion.create('5.6.1', false)
    const tools = await Platform.toolchains(ver5_6_1)
    expect(tools.length).toBe(1)
  })

  it('fetches ubuntu 16.04 latest swift 5.7 dev tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '16.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const dev5_7 = ToolchainVersion.create('5.7', true)
    const tools = await Platform.toolchains(dev5_7)
    expect(tools.length).toBe(8)
  })

  it('fetches ubuntu 20.04 latest swift 5.2 tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '20.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const ver5_2 = ToolchainVersion.create('5.2', false)
    const tools = await Platform.toolchains(ver5_2)
    expect(tools.length).toBe(2)
  })

  it('fetches ubuntu 22.04 custom swift tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '22.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const swiftwasm = 'https://github.com/swiftwasm/swift/releases/download'
    const name = 'swift-wasm-5.10-SNAPSHOT-2024-03-30-a'
    const resource = `${name}-ubuntu22.04_x86_64.tar.gz`
    const toolchainUrl = `${swiftwasm}/${name}/${resource}`
    const cVer = ToolchainVersion.create(toolchainUrl, false)
    const tools = await Platform.toolchains(cVer)
    expect(tools.length).toBe(1)
    const tool = tools[0]
    expect(tool.baseUrl?.href).toBe(posix.dirname(toolchainUrl))
    expect(tool.preventCaching).toBe(true)
    expect(tool.name).toBe('Swift Custom Snapshot')
    expect(tool.platform).toBe('ubuntu2204')
    expect(tool.download).toBe(resource)
    expect(tool.dir).toBe(name)
    expect(tool.branch).toBe('swiftwasm')
  })

  it.each(['static-sdk', 'static-sdk:0.0.1'])(
    'fetches ubuntu 22.04 swift tool with SDK %i',
    async sdk => {
      setos({os: 'linux', dist: 'Ubuntu', release: '22.04'})
      jest.spyOn(os, 'arch').mockReturnValue('x64')
      const version = ToolchainVersion.create('6.1.1', false, [sdk])
      const tool = await Platform.toolchain(version)
      expect(tool).toBeTruthy()
      const lTool = tool as LinuxToolchainSnapshot
      expect(lTool.download).toBe('swift-6.1.1-RELEASE-ubuntu22.04.tar.gz')
      expect(lTool.dir).toBe('swift-6.1.1-RELEASE')
      expect(lTool.platform).toBe('ubuntu2204')
      expect(lTool.branch).toBe('swift-6.1.1-release')
      expect(lTool.download_signature).toBe(
        'swift-6.1.1-RELEASE-ubuntu22.04.tar.gz.sig'
      )
      expect(lTool.preventCaching).toBe(false)
      if (!tool) {
        return
      }

      const sdkSnapshots = await version.sdkSnapshots(tool)
      expect(sdkSnapshots.length).toBe(1)
      const sdkSnapshot = sdkSnapshots[0]
      expect(sdkSnapshot.platform).toBe('static-sdk')
      expect(sdkSnapshot.dir).toBe('swift-6.1.1-RELEASE')
      expect(sdkSnapshot.branch).toBe('swift-6.1.1-release')
      expect(sdkSnapshot.download).toBe(
        'swift-6.1.1-RELEASE_static-linux-0.0.1.artifactbundle.tar.gz'
      )
      expect(sdkSnapshot.checksum).toBe(
        '8a69753e181e40c202465f03bcafcc898070a86817ca0f39fc808f76638e90c2'
      )
    }
  )

  it('fetches ubuntu 22.04 named swift tool with Linux SDK', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '22.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const name = 'swift-6.0-DEVELOPMENT-SNAPSHOT-2024-09-17-a'
    const version = ToolchainVersion.create(name, false, ['static-sdk'])
    const tool = await Platform.toolchain(version)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe(
      'swift-6.0-DEVELOPMENT-SNAPSHOT-2024-09-17-a-ubuntu22.04.tar.gz'
    )
    expect(lTool.dir).toBe('swift-6.0-DEVELOPMENT-SNAPSHOT-2024-09-17-a')
    expect(lTool.platform).toBe('ubuntu2204')
    expect(lTool.branch).toBe('swift-6.0-branch')
    expect(lTool.download_signature).toBe(
      'swift-6.0-DEVELOPMENT-SNAPSHOT-2024-09-17-a-ubuntu22.04.tar.gz.sig'
    )
    expect(lTool.preventCaching).toBe(false)
    if (!tool) {
      return
    }

    const sdkSnapshots = await version.sdkSnapshots(tool)
    expect(sdkSnapshots.length).toBe(1)
    const sdkSnapshot = sdkSnapshots[0]
    expect(sdkSnapshot.platform).toBe('static-sdk')
    expect(sdkSnapshot.dir).toBe('swift-6.0-DEVELOPMENT-SNAPSHOT-2024-09-17-a')
    expect(sdkSnapshot.branch).toBe('swift-6.0-branch')
    expect(sdkSnapshot.download).toBe(
      'swift-6.0-DEVELOPMENT-SNAPSHOT-2024-09-17-a_static-linux-0.0.1.artifactbundle.tar.gz'
    )
    expect(sdkSnapshot.checksum).toBe(
      '83a88650cd0675552ce2cf8159c31966fde73418f49493c1644073fffe8be9f4'
    )
  })

  it('fetches ubuntu 22.04 named swift tool with WASM SDK', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '22.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const name = 'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a'
    const version = ToolchainVersion.create(name, false, ['wasm-sdk'])
    const tool = await Platform.toolchain(version)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe(
      'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a-ubuntu22.04.tar.gz'
    )
    expect(lTool.dir).toBe('swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a')
    expect(lTool.platform).toBe('ubuntu2204')
    expect(lTool.branch).toBe('swift-6.2-branch')
    expect(lTool.download_signature).toBe(
      'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a-ubuntu22.04.tar.gz.sig'
    )
    expect(lTool.preventCaching).toBe(false)
    if (!tool) {
      return
    }

    const sdkSnapshots = await version.sdkSnapshots(tool)
    expect(sdkSnapshots.length).toBe(1)
    const sdkSnapshot = sdkSnapshots[0]
    expect(sdkSnapshot.platform).toBe('wasm-sdk')
    expect(sdkSnapshot.dir).toBe('swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a')
    expect(sdkSnapshot.branch).toBe('swift-6.2-branch')
    expect(sdkSnapshot.download).toBe(
      'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a_wasm.artifactbundle.tar.gz'
    )
    expect(sdkSnapshot.checksum).toBe(
      '40f3c780d4a8f3d369c203615330e1b00441b6f8b7023535bebc16bf4dd5f84a'
    )
  })

  it('fetches ubuntu 22.04 named swift tool with Linux and WASM SDK', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '22.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const name = 'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a'
    const version = ToolchainVersion.create(name, false, [
      'static-sdk',
      'wasm-sdk'
    ])
    const tool = await Platform.toolchain(version)
    expect(tool).toBeTruthy()
    const lTool = tool as LinuxToolchainSnapshot
    expect(lTool.download).toBe(
      'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a-ubuntu22.04.tar.gz'
    )
    expect(lTool.dir).toBe('swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a')
    expect(lTool.platform).toBe('ubuntu2204')
    expect(lTool.branch).toBe('swift-6.2-branch')
    expect(lTool.download_signature).toBe(
      'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a-ubuntu22.04.tar.gz.sig'
    )
    expect(lTool.preventCaching).toBe(false)
    if (!tool) {
      return
    }

    const sdkSnapshots = await version.sdkSnapshots(tool)
    expect(sdkSnapshots.length).toBe(2)
    for (let i = 0; i < 2; i++) {
      const sdkSnapshot = sdkSnapshots[i]
      expect(sdkSnapshot.dir).toBe(
        'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a'
      )
      expect(sdkSnapshot.branch).toBe('swift-6.2-branch')
      if (i == 0) {
        expect(sdkSnapshot.platform).toBe('static-sdk')
        expect(sdkSnapshot.download).toBe(
          'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a_static-linux-0.0.1.artifactbundle.tar.gz'
        )
        expect(sdkSnapshot.checksum).toBe(
          '9e4065031461c00a88912e94d0c7d847e701a28667f58facad49dc636de77b6f'
        )
      } else {
        expect(sdkSnapshot.platform).toBe('wasm-sdk')
        expect(sdkSnapshot.download).toBe(
          'swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a_wasm.artifactbundle.tar.gz'
        )
        expect(sdkSnapshot.checksum).toBe(
          '40f3c780d4a8f3d369c203615330e1b00441b6f8b7023535bebc16bf4dd5f84a'
        )
      }
    }
  })
})
