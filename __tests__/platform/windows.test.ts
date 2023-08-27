import os from 'os'
// @ts-ignore
import {__setos as setos} from 'getos'
import {Platform, WindowsPlatform} from '../../src/platform'

jest.mock('getos')

describe('windows platform detection', () => {
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
