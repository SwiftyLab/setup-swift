import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {SdkToolchainInstaller} from '../../src/installer/sdk'
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'

vi.mock('@actions/core', {spy: true})
vi.mock('@actions/exec', {spy: true})

describe('SDK toolchain installation', () => {
  const sdkSnapshot = {
    name: 'Swift SDK for Android',
    date: new Date('2024-03-30 10:28:49.000000000 -05:00'),
    download: 'swift-6.0-android-sdk.tar.gz',
    checksum: 'abc123',
    dir: 'swift-6.0-RELEASE',
    platform: 'android',
    branch: 'swift-6.0-release',
    preventCaching: false
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('tests install succeeds on first attempt', async () => {
    const installer = new SdkToolchainInstaller(sdkSnapshot)
    const execSpy = vi.spyOn(exec, 'exec').mockResolvedValue(0)

    await installer.install('x86_64', false)

    expect(execSpy).toHaveBeenCalledTimes(1)
    expect(execSpy).toHaveBeenCalledWith('swift', [
      'sdk',
      'install',
      'https://download.swift.org/swift-6.0-release/android/swift-6.0-RELEASE/swift-6.0-android-sdk.tar.gz',
      '--checksum',
      'abc123'
    ])
  })

  it('tests install without checksum', async () => {
    const snapshotWithoutChecksum = {...sdkSnapshot, checksum: undefined}
    const installer = new SdkToolchainInstaller(snapshotWithoutChecksum)
    const execSpy = vi.spyOn(exec, 'exec').mockResolvedValue(0)

    await installer.install('aarch64', false)

    expect(execSpy).toHaveBeenCalledTimes(1)
    expect(execSpy).toHaveBeenCalledWith('swift', [
      'sdk',
      'install',
      'https://download.swift.org/swift-6.0-release/android/swift-6.0-RELEASE/swift-6.0-android-sdk.tar.gz'
    ])
  })

  it('tests install retries on failure and succeeds on second attempt', async () => {
    const installer = new SdkToolchainInstaller(sdkSnapshot)
    const execSpy = vi
      .spyOn(exec, 'exec')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(0)
    const infoSpy = vi.spyOn(core, 'info').mockReturnValue()

    const installPromise = installer.install('x86_64', false)

    // Fast-forward through first retry delay (1000ms)
    await vi.advanceTimersByTimeAsync(1000)

    await installPromise

    expect(execSpy).toHaveBeenCalledTimes(2)
    expect(infoSpy).toHaveBeenCalledWith('Waiting 1000ms before retrying')
  })

  it('tests install retries on failure and succeeds on third attempt', async () => {
    const installer = new SdkToolchainInstaller(sdkSnapshot)
    const execSpy = vi
      .spyOn(exec, 'exec')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce(0)
    const infoSpy = vi.spyOn(core, 'info').mockReturnValue()

    const installPromise = installer.install('x86_64', false)

    // Fast-forward through first retry delay (1000ms)
    await vi.advanceTimersByTimeAsync(1000)
    // Fast-forward through second retry delay (2000ms)
    await vi.advanceTimersByTimeAsync(2000)

    await installPromise

    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(infoSpy).toHaveBeenCalledWith('Waiting 1000ms before retrying')
    expect(infoSpy).toHaveBeenCalledWith('Waiting 2000ms before retrying')
  })

  it('tests install throws after three failed attempts', async () => {
    vi.useRealTimers()
    const installer = new SdkToolchainInstaller(sdkSnapshot)
    const error = new Error('Persistent network error')
    const execSpy = vi.spyOn(exec, 'exec').mockRejectedValue(error)
    // Mock setTimeout to resolve immediately for faster test execution
    vi.spyOn(global, 'setTimeout').mockImplementation(callback => {
      callback()
      return 0 as unknown as NodeJS.Timeout
    })

    await expect(installer.install('x86_64', false)).rejects.toThrow(
      'Persistent network error'
    )
    expect(execSpy).toHaveBeenCalledTimes(3)
  })

  it('tests install with custom base URL', async () => {
    const customSnapshot = {
      ...sdkSnapshot,
      baseUrl: new URL('https://custom.swift.org/downloads/')
    }
    const installer = new SdkToolchainInstaller(customSnapshot)
    const execSpy = vi.spyOn(exec, 'exec').mockResolvedValue(0)

    await installer.install('x86_64', false)

    expect(execSpy).toHaveBeenCalledTimes(1)
    expect(execSpy).toHaveBeenCalledWith('swift', [
      'sdk',
      'install',
      'https://custom.swift.org/downloads/swift-6.0-android-sdk.tar.gz',
      '--checksum',
      'abc123'
    ])
  })
})
