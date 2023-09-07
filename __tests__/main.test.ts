import * as core from '@actions/core'
import * as main from '../src/main'
import {Swiftorg} from '../src/swiftorg'
import {Platform} from '../src/platform'
import {LinuxToolchainInstaller} from '../src/installer'

describe('setup-swift run validation', () => {
  const swiftorgSpy = jest
    .spyOn(Swiftorg.prototype, 'update')
    .mockResolvedValue()
  const toolchainSpy = jest.spyOn(Platform, 'toolchain')
  const installSpy = jest.spyOn(Platform, 'install')
  const outputSpy = jest.spyOn(core, 'setOutput')
  const failedSpy = jest.spyOn(core, 'setFailed')
  const toolchain = {
    name: 'Ubuntu 22.04',
    date: new Date('2023-03-30 10:28:49.000000000 -05:00'),
    download: 'swift-5.8-RELEASE-ubuntu22.04.tar.gz',
    download_signature: 'swift-5.8-RELEASE-ubuntu22.04.tar.gz.sig',
    dir: 'swift-5.8-RELEASE',
    docker: '5.8-jammy',
    platform: 'ubuntu2204',
    branch: 'swift-5.8-release'
  }

  it('tests dry run', async () => {
    toolchainSpy.mockResolvedValue(toolchain)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(core, 'getInput').mockReturnValue('latest')
    await main.run()
    expect(failedSpy).not.toHaveBeenCalled()
    expect(installSpy).not.toHaveBeenCalled()
    for (const spy of [swiftorgSpy, toolchainSpy, outputSpy]) {
      expect(spy).toHaveBeenCalled()
    }
    for (const call of outputSpy.mock.calls) {
      switch (call[0]) {
        case 'swift-version':
          expect(call.slice(1)).toStrictEqual(['5.8'])
          break
        case 'toolchain': {
          const obj = JSON.parse(call[1])
          obj.date = new Date(obj.date)
          expect(obj).toStrictEqual(toolchain)
          break
        }
      }
    }
  })

  it('tests install', async () => {
    const installer = new LinuxToolchainInstaller(toolchain)
    installSpy.mockResolvedValue(installer)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(false)
    jest.spyOn(core, 'getInput').mockReturnValue('latest')
    jest.spyOn(installer, 'installedSwiftVersion').mockResolvedValue('5.8')
    await main.run()
    expect(failedSpy).not.toHaveBeenCalled()
    expect(toolchainSpy).not.toHaveBeenCalled()
    for (const spy of [swiftorgSpy, installSpy, outputSpy]) {
      expect(spy).toHaveBeenCalled()
    }
    for (const call of outputSpy.mock.calls) {
      switch (call[0]) {
        case 'swift-version':
          expect(call.slice(1)).toStrictEqual(['5.8'])
          break
        case 'toolchain': {
          const obj = JSON.parse(call[1])
          obj.date = new Date(obj.date)
          expect(obj).toStrictEqual(toolchain)
          break
        }
      }
    }
  })

  it('tests failure', async () => {
    toolchainSpy.mockResolvedValue(undefined)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(core, 'getInput').mockReturnValue('latest')
    await main.run()
    expect(failedSpy).toHaveBeenCalled()
    for (const spy of [installSpy, outputSpy]) {
      expect(spy).not.toHaveBeenCalled()
    }
  })
})
