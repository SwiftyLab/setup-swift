import * as path from 'path'
import {promises as fs} from 'fs'
// @ts-ignore
import {__setContent as setContent} from 'https'
import * as core from '@actions/core'
import {updateSdkModules} from '../../../src/installer/windows/modules'

jest.mock('https')

describe('windows modules SDK update', () => {
  const env = process.env
  const mockSdkRoot = path.resolve('mock', 'sdk', 'root')
  const mockSwiftPath = path.resolve('mock', 'swift', 'bin', 'swift.exe')

  beforeEach(() => {
    process.env = {...env}
    process.env.PATH = path.dirname(mockSwiftPath)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = env
  })

  it('successfully updates all SDK module definitions', async () => {
    const moduleContent = 'module TestModule { header "test.h" }'

    setContent({
      statusCode: 200,
      data: moduleContent,
      headers: {
        'content-type': 'text/plain'
      }
    })

    jest.spyOn(fs, 'access').mockResolvedValue()
    const mkdirSpy = jest.spyOn(fs, 'mkdir').mockResolvedValue('')
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue()

    await updateSdkModules(mockSdkRoot)

    // Verify directories were created
    const usrShare = path.join(mockSdkRoot, 'usr', 'share')
    const clangInclude = path.join(
      path.dirname(path.dirname(mockSwiftPath)),
      'lib',
      'swift',
      'clang',
      'include'
    )

    expect(mkdirSpy).toHaveBeenCalledTimes(2)
    expect(mkdirSpy).toHaveBeenCalledWith(usrShare, {recursive: true})
    expect(mkdirSpy).toHaveBeenCalledWith(clangInclude, {recursive: true})

    // Verify all 7 module files were written
    expect(writeFileSpy).toHaveBeenCalledTimes(7)

    // Check specific module files
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(usrShare, 'winsdk.modulemap'),
      moduleContent
    )
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(usrShare, 'winsdk_um.modulemap'),
      moduleContent
    )
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(usrShare, 'winsdk_shared.modulemap'),
      moduleContent
    )
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(usrShare, 'ucrt.modulemap'),
      moduleContent
    )
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(usrShare, 'vcruntime.modulemap'),
      moduleContent
    )
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(usrShare, 'vcruntime.apinotes'),
      moduleContent
    )
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(clangInclude, 'module.modulemap'),
      moduleContent
    )
  })

  it('handles HTTP errors with retry logic', async () => {
    setContent({
      statusCode: 404,
      data: 'Not Found',
      headers: {
        'content-type': 'text/plain'
      }
    })

    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'mkdir').mockResolvedValue('')

    // Mock setTimeout to avoid actual delays
    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

    await expect(updateSdkModules(mockSdkRoot)).rejects.toThrow(
      "Request Failed Status Code: '404'"
    )
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2)
  })

  it('handles successful retry after initial failures', async () => {
    let attemptCount = 0
    const moduleContent = 'module TestModule { header "test.h" }'

    // Mock https.get to fail twice then succeed
    jest
      .spyOn(require('https'), 'get')
      .mockImplementation((url: any, callback: any) => {
        attemptCount++

        if (attemptCount <= 2) {
          // First two attempts fail
          const res = {
            statusCode: 500,
            url: url,
            headers: {'content-type': 'text/plain'},
            on: (event: string, listener: Function) => {
              if (event === 'data') {
                listener('Internal Server Error')
              } else if (event === 'end') {
                listener()
              }
            },
            setEncoding: () => {},
            resume: () => {}
          }
          callback(res)
        } else {
          // Third attempt succeeds
          const res = {
            statusCode: 200,
            url: url,
            headers: {'content-type': 'text/plain'},
            on: (event: string, listener: Function) => {
              if (event === 'data') {
                listener(moduleContent)
              } else if (event === 'end') {
                listener()
              }
            },
            setEncoding: () => {},
            resume: () => {}
          }
          callback(res)
        }

        return {} as any
      })

    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'mkdir').mockResolvedValue('')
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue()

    // Mock setTimeout to avoid actual delays
    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

    await updateSdkModules(mockSdkRoot)

    // Should have succeeded and written the file
    expect(writeFileSpy).toHaveBeenCalledWith(
      expect.stringContaining('winsdk.modulemap'),
      moduleContent
    )
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2)
  })

  it('handles retry delays correctly', async () => {
    setContent({
      statusCode: 500,
      data: 'Internal Server Error',
      headers: {
        'content-type': 'text/plain'
      }
    })

    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'mkdir').mockResolvedValue('')

    // Mock setTimeout to avoid actual delays but still track calls
    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

    await expect(updateSdkModules(mockSdkRoot)).rejects.toThrow()

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000)
  })

  it('throws error when Swift command not found in PATH', async () => {
    process.env.PATH = '/nonexistent/path'

    jest.spyOn(fs, 'access').mockRejectedValue(new Error('ENOENT'))

    // Mock setTimeout to avoid actual delays but still track calls
    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

    await expect(updateSdkModules(mockSdkRoot)).rejects.toThrow(
      'Swift command not found in PATH'
    )
    expect(setTimeoutSpy).not.toHaveBeenCalled()
  })

  it('handles cross-platform Swift executable detection', async () => {
    const originalPlatform = process.platform

    // Test Windows platform
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    })

    const windowsSwiftPath = path.resolve('mock', 'swift', 'bin', 'swift.exe')
    process.env.PATH = path.dirname(windowsSwiftPath)

    jest.spyOn(fs, 'access').mockImplementation(async filePath => {
      if (filePath === windowsSwiftPath) {
        return Promise.resolve()
      }
      throw new Error('ENOENT')
    })
    jest.spyOn(fs, 'mkdir').mockResolvedValue('')
    jest.spyOn(fs, 'writeFile').mockResolvedValue()

    setContent({
      statusCode: 200,
      data: 'module content',
      headers: {'content-type': 'text/plain'}
    })

    await expect(updateSdkModules(mockSdkRoot)).resolves.not.toThrow()

    // Test Unix platform
    Object.defineProperty(process, 'platform', {
      value: 'linux'
    })

    const unixSwiftPath = path.resolve('mock', 'swift', 'bin', 'swift')
    process.env.PATH = path.dirname(unixSwiftPath)

    jest.spyOn(fs, 'access').mockImplementation(async filePath => {
      if (filePath === unixSwiftPath) {
        return Promise.resolve()
      }
      throw new Error('ENOENT')
    })

    await expect(updateSdkModules(mockSdkRoot)).resolves.not.toThrow()

    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    })
  })

  it('throws error when file system errors during directory creation', async () => {
    setContent({
      statusCode: 200,
      data: 'module content',
      headers: {'content-type': 'text/plain'}
    })

    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'mkdir').mockRejectedValue(new Error('Permission denied'))

    await expect(updateSdkModules(mockSdkRoot)).rejects.toThrow(
      'Permission denied'
    )
  })

  it('throws error when file system errors during file writing', async () => {
    setContent({
      statusCode: 200,
      data: 'module content',
      headers: {'content-type': 'text/plain'}
    })

    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(fs, 'mkdir').mockResolvedValue('')
    jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Disk full'))

    await expect(updateSdkModules(mockSdkRoot)).rejects.toThrow('Disk full')
  })
})
