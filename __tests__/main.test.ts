import * as core from '@actions/core'
import * as main from '../src/main'
import {Swiftorg} from '../src/swiftorg'
import {Platform} from '../src/platform'
import {SdkSupportedVersion} from '../src/version'
import {LinuxToolchainInstaller, SdkToolchainInstaller} from '../src/installer'

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
    branch: 'swift-5.8-release',
    preventCaching: false
  }
  const sdkToolchains = [
    {
      name: 'Static SDK',
      date: new Date('2023-03-30 10:28:49.000000000 -05:00'),
      download: 'swift-5.8-RELEASE_static-linux-0.0.1.artifactbundle.tar.gz',
      checksum:
        'df0b40b9b582598e7e3d70c82ab503fd6fbfdff71fd17e7f1ab37115a0665b3b',
      dir: 'swift-5.8-RELEASE',
      platform: 'static-sdk',
      branch: 'swift-5.8-release',
      preventCaching: true
    }
  ]

  it('tests dry run', async () => {
    toolchainSpy.mockResolvedValue(toolchain)
    jest.spyOn(core, 'getBooleanInput').mockReturnValue(true)
    jest.spyOn(core, 'getInput').mockReturnValue('latest')
    jest
      .spyOn(SdkSupportedVersion.prototype, 'sdkSnapshots')
      .mockResolvedValue(sdkToolchains)
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
        case 'sdks': {
          const objs = JSON.parse(call[1])
          for (let i = 0; i < objs.length; i++) {
            const obj = objs[i]
            const sdkToolchain = sdkToolchains[i]
            obj.date = new Date(obj.date)
            expect(obj).toStrictEqual(sdkToolchain)
          }
          break
        }
      }
    }
  })

  it('tests install', async () => {
    const installer = new LinuxToolchainInstaller(toolchain)
    const sdkInstallers = sdkToolchains.map(
      toolchain => new SdkToolchainInstaller(toolchain)
    )
    installSpy.mockResolvedValue({installer, sdkInstallers})
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
        case 'sdks': {
          const objs = JSON.parse(call[1])
          for (let i = 0; i < objs.length; i++) {
            const obj = objs[i]
            const sdkToolchain = sdkToolchains[i]
            obj.date = new Date(obj.date)
            expect(obj).toStrictEqual(sdkToolchain)
          }
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
