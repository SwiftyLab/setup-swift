import os from 'os'
// @ts-ignore
import {__setos as setos} from 'getos'
import {Platform, XcodePlatform} from '../../src/platform'

jest.mock('getos')

describe('macos platform detection', () => {
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
})
