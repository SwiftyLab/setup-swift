import os from 'os'
import {__setos as setos} from '../../__mocks__/getos'
import {Platform, WindowsPlatform} from '../../src/platform'
import {describe, expect, it, vi} from 'vitest'

vi.mock('getos')
vi.mock('os', {spy: true})

describe('windows platform detection', () => {
  it('detects windows', async () => {
    setos({os: 'win32'})
    vi.spyOn(os, 'arch').mockReturnValue('x64')
    const platform = await Platform.currentPlatform()
    expect(platform.name).toBe('windows')
    expect(platform).toBeInstanceOf(WindowsPlatform)
    expect((platform as WindowsPlatform).version).toBe(10)
    expect(platform.arch).toBe('x86_64')
    expect(platform.file).toBe('windows10')
  })

  it('throws error for unsupported os', async () => {
    expect.assertions(1)
    setos({os: 'cygwin'})
    vi.spyOn(os, 'arch').mockReturnValue('x64')
    await expect(Platform.currentPlatform()).rejects.toThrow(
      new Error(`OS cygwin unsupported for Swift`)
    )
  })
})
