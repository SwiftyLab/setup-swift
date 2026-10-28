import * as gpg from '../../src/utils/gpg'
import * as childProcess from 'child_process'
import * as core from '@actions/core'
import * as io from '@actions/io'
import * as toolCache from '@actions/tool-cache'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('child_process', {spy: true})
vi.mock('@actions/core', {spy: true})
vi.mock('@actions/io', {spy: true})
vi.mock('@actions/tool-cache', {spy: true})

function pendingProcess() {
  const child = new childProcess.ChildProcess()
  const kill = vi.spyOn(child, 'kill').mockReturnValue(true)
  return {child, kill}
}

function exitingProcess(code: number) {
  const {child} = pendingProcess()
  queueMicrotask(() => child.emit('exit', code, null))
  return child
}

describe('gpg setup validation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(io.which).mockResolvedValue('gpg')
    vi.mocked(toolCache.downloadTool).mockResolvedValue('keys')
    vi.mocked(core.info).mockImplementation(() => {})
    vi.mocked(core.warning).mockImplementation(() => {})
    vi.mocked(core.debug).mockImplementation(() => {})
    vi.mocked(childProcess.spawn).mockImplementation(() => exitingProcess(0))
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('imports keys and refreshes them over HKPS', async () => {
    await gpg.setupKeys()
    expect(childProcess.spawn).toHaveBeenNthCalledWith(
      1,
      'gpg',
      ['--import', 'keys'],
      {stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true}
    )
    expect(childProcess.spawn).toHaveBeenNthCalledWith(
      2,
      'gpg',
      [
        '--keyserver',
        'hkps://keyserver.ubuntu.com:443',
        '--refresh-keys',
        'Swift'
      ],
      {stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true}
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  it('uses HKPS for fallback key retrieval', async () => {
    vi.mocked(childProcess.spawn).mockImplementationOnce(() =>
      exitingProcess(2)
    )
    await gpg.setupKeys()
    expect(childProcess.spawn).toHaveBeenNthCalledWith(
      2,
      'gpg',
      expect.arrayContaining([
        '--keyserver',
        'hkps://keyserver.ubuntu.com:443',
        '--recv-keys'
      ]),
      {stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true}
    )
    expect(childProcess.spawn).toHaveBeenCalledTimes(3)
  })

  it('propagates failed fallback retrieval', async () => {
    vi.mocked(childProcess.spawn).mockImplementation(() => exitingProcess(2))
    await expect(gpg.setupKeys()).rejects.toThrow('exit code 2')
    expect(childProcess.spawn).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('retries a failed refresh', async () => {
    vi.mocked(childProcess.spawn)
      .mockImplementationOnce(() => exitingProcess(0))
      .mockImplementationOnce(() => exitingProcess(2))
    await gpg.setupKeys()
    expect(childProcess.spawn).toHaveBeenCalledTimes(3)
  })

  it('waits for a stalled refresh to exit before retrying', async () => {
    const {child: stalled, kill} = pendingProcess()
    vi.mocked(childProcess.spawn)
      .mockImplementationOnce(() => exitingProcess(0))
      .mockReturnValueOnce(stalled)
    const setup = gpg.setupKeys()

    await vi.advanceTimersByTimeAsync(60_000)
    expect(kill).toHaveBeenCalledWith('SIGTERM')
    expect(childProcess.spawn).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(kill).toHaveBeenLastCalledWith('SIGKILL')
    expect(childProcess.spawn).toHaveBeenCalledTimes(2)

    stalled.emit('exit', null, 'SIGKILL')
    await setup
    expect(childProcess.spawn).toHaveBeenCalledTimes(3)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('fails after both refresh attempts time out', async () => {
    vi.mocked(childProcess.spawn)
      .mockImplementationOnce(() => exitingProcess(0))
      .mockImplementation(() => {
        const {child, kill} = pendingProcess()
        kill.mockImplementation(signal => {
          queueMicrotask(() => child.emit('exit', null, signal))
          return true
        })
        return child
      })
    const failed = expect(gpg.setupKeys()).rejects.toThrow(
      'Failed to refresh keys from any server in the pool'
    )
    await vi.advanceTimersByTimeAsync(120_000)
    await failed
    expect(childProcess.spawn).toHaveBeenCalledTimes(3)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('forwards verification paths containing spaces and clears its timeout', async () => {
    const {child, kill} = pendingProcess()
    vi.mocked(childProcess.spawn).mockReturnValueOnce(child)
    const verification = gpg.verify(
      'signature with spaces.asc',
      'archive with spaces.tar.gz'
    )
    await vi.advanceTimersByTimeAsync(0)
    child.emit('exit', 0, null)
    await verification
    expect(io.which).toHaveBeenCalledWith('gpg', true)
    expect(childProcess.spawn).toHaveBeenCalledWith(
      'gpg',
      ['--verify', 'signature with spaces.asc', 'archive with spaces.tar.gz'],
      {stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true}
    )
    await vi.advanceTimersByTimeAsync(70_000)
    expect(kill).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects a failed signature verification', async () => {
    vi.mocked(childProcess.spawn).mockImplementationOnce(() =>
      exitingProcess(2)
    )
    await expect(gpg.verify('signature', 'archive')).rejects.toThrow(
      'exit code 2'
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects a timed-out verification even if GPG exits with status zero', async () => {
    const {child: stalled, kill} = pendingProcess()
    vi.mocked(childProcess.spawn).mockReturnValueOnce(stalled)
    const failed = expect(gpg.verify('signature', 'archive')).rejects.toThrow(
      'GPG command timed out after 60 seconds'
    )
    await vi.advanceTimersByTimeAsync(60_000)
    expect(kill).toHaveBeenCalledWith('SIGTERM')
    stalled.emit('exit', 0, null)
    await failed
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(kill).toHaveBeenCalledTimes(1)
  })

  it('rejects an unexpected termination signal', async () => {
    const {child} = pendingProcess()
    vi.mocked(childProcess.spawn).mockReturnValueOnce(child)
    const failed = expect(gpg.verify('signature', 'archive')).rejects.toThrow(
      'terminated by SIGTERM'
    )
    await vi.advanceTimersByTimeAsync(0)
    child.emit('exit', null, 'SIGTERM')
    await failed
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears its timeout when GPG cannot start', async () => {
    const {child} = pendingProcess()
    vi.mocked(childProcess.spawn).mockReturnValueOnce(child)
    const failed = expect(gpg.verify('signature', 'archive')).rejects.toThrow(
      'Cannot start GPG'
    )
    await vi.advanceTimersByTimeAsync(0)
    child.emit('error', new Error('Cannot start GPG'))
    await failed
    expect(vi.getTimerCount()).toBe(0)
  })
})
