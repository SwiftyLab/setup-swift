import {promises as fs} from 'fs'
import * as exec from '@actions/exec'
import {Swiftorg} from '../src/swiftorg'
import {MODULE_DIR} from '../src/const'

describe('swiftorg sync validation', () => {
  const accessSpy = jest.spyOn(fs, 'access')
  const rmdirSpy = jest.spyOn(fs, 'rmdir').mockResolvedValue()
  const execSpy = jest.spyOn(exec, 'exec')

  it('tests latest sync', async () => {
    accessSpy.mockResolvedValue()
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue(['download'])
    const swiftorg = new Swiftorg(true)
    await swiftorg.update()
    expect(rmdirSpy).not.toHaveBeenCalled()
    expect(execSpy).toHaveBeenCalledTimes(2)
    const gitArgs = ['submodule', 'update', '--init', '--recursive', '--remote']
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      gitArgs,
      {cwd: MODULE_DIR}
    ])
  })

  it('tests without latest sync', async () => {
    accessSpy.mockResolvedValue()
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue(['download'])
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(rmdirSpy).not.toHaveBeenCalled()
    expect(execSpy).toHaveBeenCalledTimes(2)
    const gitArgs = ['submodule', 'update', '--init']
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      gitArgs,
      {cwd: MODULE_DIR}
    ])
  })

  it('tests latest sync failure with empty swiftorg', async () => {
    accessSpy.mockResolvedValue()
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    const swiftorg = new Swiftorg(true)
    await swiftorg.update()
    expect(rmdirSpy).toHaveBeenCalled()
    expect(execSpy).toHaveBeenCalledTimes(3)
  })

  it('tests without latest sync failure with empty swiftorg', async () => {
    accessSpy.mockResolvedValue()
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(rmdirSpy).toHaveBeenCalled()
    expect(execSpy).toHaveBeenCalledTimes(4)
  })

  it('tests latest sync failure with no swiftorg', async () => {
    accessSpy.mockRejectedValue(new Error())
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    const swiftorg = new Swiftorg(true)
    await swiftorg.update()
    expect(rmdirSpy).not.toHaveBeenCalled()
    expect(execSpy).toHaveBeenCalledTimes(3)
  })

  it('tests without latest sync failure with no swiftorg', async () => {
    accessSpy.mockRejectedValue(new Error())
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(rmdirSpy).not.toHaveBeenCalled()
    expect(execSpy).toHaveBeenCalledTimes(4)
  })

  it('tests without latest sync failure with empty swiftorg and no commit in package.json', async () => {
    accessSpy.mockResolvedValue()
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    fs.readFile = jest.fn().mockResolvedValue('{}')
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(rmdirSpy).toHaveBeenCalled()
    expect(execSpy).toHaveBeenCalledTimes(3)
  })

  it('tests without latest sync failure with no swiftorg and no commit in package.json', async () => {
    accessSpy.mockRejectedValue(new Error())
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    fs.readFile = jest.fn().mockResolvedValue('{}')
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(rmdirSpy).not.toHaveBeenCalled()
    expect(execSpy).toHaveBeenCalledTimes(3)
  })
})
