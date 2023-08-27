import os from 'os'
// @ts-ignore
import {__setos as setos} from 'getos'
import {Platform, LinuxPlatform} from '../../src/platform'

jest.mock('getos')

describe('linux platform detection', () => {
  it('detects ubuntu', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const platform = await Platform.currentPlatform()
    expect(platform.name).toBe('ubuntu')
    expect(platform).toBeInstanceOf(LinuxPlatform)
    expect((platform as LinuxPlatform).version).toBe(1804)
    expect(platform.arch).toBe('x86_64')
    expect(platform.file).toBe('ubuntu1804')
  })

  it('detects ubuntu with arm arch', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('arm64')
    const platform = await Platform.currentPlatform()
    expect(platform.name).toBe('ubuntu')
    expect(platform).toBeInstanceOf(LinuxPlatform)
    expect((platform as LinuxPlatform).version).toBe(1804)
    expect(platform.arch).toBe('aarch64')
    expect(platform.file).toBe('ubuntu1804-aarch64')
  })

  it('detects centos', async () => {
    setos({os: 'linux', dist: 'CentOS', release: '7'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const platform = await Platform.currentPlatform()
    expect(platform.name).toBe('centos')
    expect(platform).toBeInstanceOf(LinuxPlatform)
    expect((platform as LinuxPlatform).version).toBe(7)
    expect(platform.arch).toBe('x86_64')
    expect(platform.file).toBe('centos7')
  })
})
