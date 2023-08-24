import os from 'os'
// @ts-ignore
import {__setos as setos} from 'getos'
import {
  XcodePlatform,
  LinuxPlatform,
  WindowsPlatform,
  Platform
} from '../src/platform'

jest.mock('getos')

describe('platform detection', () => {
  it('detects macOS', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const platform = await Platform.currentPlatform()
    expect(platform).toBeInstanceOf(XcodePlatform)
    expect(platform.name).toBe('xcode')
    expect(platform.file).toBe('xcode')
  })

  it('detects macOS with arm arch', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('arm64')
    const platform = await Platform.currentPlatform()
    expect(platform).toBeInstanceOf(XcodePlatform)
    expect(platform.name).toBe('xcode')
    expect(platform.arch).toBe('aarch64')
    expect(platform.file).toBe('xcode')
  })

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

  it('detects windows', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const platform = await Platform.currentPlatform()
    expect(platform.name).toBe('windows')
    expect(platform).toBeInstanceOf(WindowsPlatform)
    expect((platform as WindowsPlatform).version).toBe(10)
    expect(platform.arch).toBe('x86_64')
    expect(platform.file).toBe('windows10')
  })

  it('throws error for unsupported os', async () => {
    expect.assertions(1)
    setos({os: 'unknown', dist: 'unknown', release: '1'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    await expect(Platform.currentPlatform()).rejects.toMatchObject(
      new Error(`OS unknown unsupported for Swift`)
    )
  })
})
