import os from 'os'
import {__setos as setos} from '../../__mocks__/getos'
import {Platform, LinuxPlatform} from '../../src/platform'
import {describe, expect, it, vi} from 'vitest'

vi.mock('getos')
vi.mock('os', {spy: true})

describe('linux platform detection', () => {
  it('detects ubuntu', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    vi.spyOn(os, 'arch').mockReturnValue('x64')
    const platform = await Platform.currentPlatform()
    expect(platform.name).toBe('ubuntu')
    expect(platform).toBeInstanceOf(LinuxPlatform)
    expect((platform as LinuxPlatform).version).toBe(1804)
    expect(platform.arch).toBe('x86_64')
    expect(platform.file).toBe('ubuntu1804')
  })

  it('detects ubuntu with arm arch', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    vi.spyOn(os, 'arch').mockReturnValue('arm64')
    const platform = await Platform.currentPlatform()
    expect(platform.name).toBe('ubuntu')
    expect(platform).toBeInstanceOf(LinuxPlatform)
    expect((platform as LinuxPlatform).version).toBe(1804)
    expect(platform.arch).toBe('aarch64')
    expect(platform.file).toBe('ubuntu1804-aarch64')
  })

  it('detects centos', async () => {
    setos({os: 'linux', dist: 'CentOS', release: '7'})
    vi.spyOn(os, 'arch').mockReturnValue('x64')
    const platform = await Platform.currentPlatform()
    expect(platform.name).toBe('centos')
    expect(platform).toBeInstanceOf(LinuxPlatform)
    expect((platform as LinuxPlatform).version).toBe(7)
    expect(platform.arch).toBe('x86_64')
    expect(platform.file).toBe('centos7')
  })
})
