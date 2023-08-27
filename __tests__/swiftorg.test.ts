import {promises as fs} from 'fs'
import * as exec from '@actions/exec'
import {Swiftorg} from '../src/swiftorg'
import {MODULE_DIR} from '../src/const'

describe('swiftorg sync validation', () => {
  const accessSpy = jest.spyOn(fs, 'access')
  const rmdirSpy = jest.spyOn(fs, 'rmdir')
  const execSpy = jest.spyOn(exec, 'exec')

  beforeEach(() => {
    rmdirSpy.mockResolvedValue()
  })

  it('tests latest sync', async () => {
    accessSpy.mockResolvedValue()
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue(['download'])
    const swiftorg = new Swiftorg(true)
    await swiftorg.update()
    expect(rmdirSpy).toHaveBeenCalledTimes(0)
    expect(execSpy).toHaveBeenCalledTimes(3)
    const gitArgs = [
      'submodule',
      'update',
      '--init',
      '--recursive',
      '--remote',
      '--merge'
    ]
    expect(execSpy.mock.calls[2]).toStrictEqual([
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
    expect(rmdirSpy).toHaveBeenCalledTimes(0)
    expect(execSpy).toHaveBeenCalledTimes(3)
    const gitArgs = ['submodule', 'update']
    expect(execSpy.mock.calls[2]).toStrictEqual([
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
    expect(rmdirSpy).toHaveBeenCalledTimes(1)
    expect(execSpy).toHaveBeenCalledTimes(4)
  })

  it('tests without latest sync failure with empty swiftorg', async () => {
    accessSpy.mockResolvedValue()
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(rmdirSpy).toHaveBeenCalledTimes(1)
    expect(execSpy).toHaveBeenCalledTimes(5)
  })

  it('tests latest sync failure with no swiftorg', async () => {
    accessSpy.mockRejectedValue(new Error())
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    const swiftorg = new Swiftorg(true)
    await swiftorg.update()
    expect(rmdirSpy).toHaveBeenCalledTimes(0)
    expect(execSpy).toHaveBeenCalledTimes(4)
  })

  it('tests without latest sync failure with no swiftorg', async () => {
    accessSpy.mockRejectedValue(new Error())
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(rmdirSpy).toHaveBeenCalledTimes(0)
    expect(execSpy).toHaveBeenCalledTimes(5)
  })

  it('tests without latest sync failure with empty swiftorg and no commit in package.json', async () => {
    accessSpy.mockResolvedValue()
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    fs.readFile = jest.fn().mockResolvedValue('{}')
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(rmdirSpy).toHaveBeenCalledTimes(1)
    expect(execSpy).toHaveBeenCalledTimes(4)
  })

  it('tests without latest sync failure with no swiftorg and no commit in package.json', async () => {
    accessSpy.mockRejectedValue(new Error())
    execSpy.mockResolvedValue(0)
    fs.readdir = jest.fn().mockResolvedValue([])
    fs.readFile = jest.fn().mockResolvedValue('{}')
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(rmdirSpy).toHaveBeenCalledTimes(0)
    expect(execSpy).toHaveBeenCalledTimes(4)
  })
})
