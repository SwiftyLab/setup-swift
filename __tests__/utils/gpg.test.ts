import * as gpg from '../../src/utils/gpg'
import * as exec from '@actions/exec'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@actions/exec', {spy: true})
vi.mock('@actions/tool-cache', async () => {
  const original = await vi.importActual('@actions/tool-cache')
  return {
    ...(original as object),
    downloadTool: vi.fn(() => 'keys')
  }
})

describe('gpg setup validation', () => {
  it('tests fallback keys setup', async () => {
    const execSpy = vi.spyOn(exec, 'exec')
    execSpy.mockRejectedValueOnce(new Error())
    execSpy.mockResolvedValue(0)
    await gpg.setupKeys()
  })

  it('tests keys refresh retry', async () => {
    const execSpy = vi.spyOn(exec, 'exec')
    execSpy.mockResolvedValueOnce(0)
    execSpy.mockRejectedValueOnce(new Error())
    execSpy.mockResolvedValue(0)
    await gpg.setupKeys()
  })

  it('tests keys refresh error', async () => {
    const execSpy = vi.spyOn(exec, 'exec')
    execSpy.mockResolvedValueOnce(0)
    execSpy.mockRejectedValue(new Error())
    await expect(gpg.setupKeys()).rejects.toThrow(
      new Error('Failed to refresh keys from any server in the pool')
    )
  })

  it('tests signature validation error', async () => {
    const execSpy = vi.spyOn(exec, 'exec')
    const error = new Error('Signature mismatch')
    execSpy.mockRejectedValue(error)
    await expect(gpg.verify('', '')).rejects.toThrow(error)
  })
})
