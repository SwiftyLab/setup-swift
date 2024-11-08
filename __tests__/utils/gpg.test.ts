import * as gpg from '../../src/utils/gpg'
import * as exec from '@actions/exec'

jest.mock('@actions/tool-cache', () => {
  const original = jest.requireActual('@actions/tool-cache')
  return {
    ...original,
    downloadTool: jest.fn(() => 'keys')
  }
})

describe('gpg setup validation', () => {
  it('tests fallback keys setup', async () => {
    const execSpy = jest.spyOn(exec, 'exec')
    execSpy.mockRejectedValueOnce(new Error())
    execSpy.mockResolvedValue(0)
    await gpg.setupKeys()
  })

  it('tests keys refresh retry', async () => {
    const execSpy = jest.spyOn(exec, 'exec')
    execSpy.mockResolvedValueOnce(0)
    execSpy.mockRejectedValueOnce(new Error())
    execSpy.mockResolvedValue(0)
    await gpg.setupKeys()
  })

  it('tests keys refresh error', async () => {
    const execSpy = jest.spyOn(exec, 'exec')
    execSpy.mockResolvedValueOnce(0)
    execSpy.mockRejectedValue(new Error())
    await expect(gpg.setupKeys()).rejects.toMatchObject(
      new Error('Failed to refresh keys from any server in the pool')
    )
  })

  it('tests signature validation error', async () => {
    const execSpy = jest.spyOn(exec, 'exec')
    const error = new Error('Signature mismatch')
    execSpy.mockRejectedValue(error)
    await expect(gpg.verify('', '')).rejects.toMatchObject(error)
  })
})
