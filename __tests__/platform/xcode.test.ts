import os from 'os'
import {__setos as setos} from '../../__mocks__/getos'
import {Platform, XcodePlatform} from '../../src/platform'
import {describe, expect, it, vi} from 'vitest'

vi.mock('getos')
vi.mock('os', {spy: true})

describe('macos platform detection', () => {
  it('detects macOS', async () => {
    setos({os: 'darwin'})
    vi.spyOn(os, 'arch').mockReturnValue('x64')
    const platform = await Platform.currentPlatform()
    expect(platform).toBeInstanceOf(XcodePlatform)
    expect(platform.name).toBe('xcode')
    expect(platform.file).toBe('xcode')
  })

  it('detects macOS with arm arch', async () => {
    setos({os: 'darwin'})
    vi.spyOn(os, 'arch').mockReturnValue('arm64')
    const platform = await Platform.currentPlatform()
    expect(platform).toBeInstanceOf(XcodePlatform)
    expect(platform.name).toBe('xcode')
    expect(platform.arch).toBe('aarch64')
    expect(platform.file).toBe('xcode')
  })
})
