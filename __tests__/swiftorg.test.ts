import * as path from 'path'
import * as exec from '@actions/exec'
import nock from 'nock'
import {Swiftorg, SWIFTORG} from '../src/swiftorg'
import {MODULE_DIR, SWIFTORG_ORIGIN, SWIFTORG_METADATA} from '../src/const'

describe('swiftorg sync validation', () => {
  const env = process.env
  const execSpy = jest.spyOn(exec, 'exec')

  beforeEach(() => {
    process.env = {...env}
  })

  afterEach(() => {
    process.env = env
  })

  it('tests latest sync', async () => {
    execSpy.mockResolvedValue(0)
    const swiftorg = new Swiftorg(true)
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, 'HEAD', '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests latest sync with string value', async () => {
    execSpy.mockResolvedValue(0)
    const swiftorg = new Swiftorg('true')
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, 'HEAD', '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests latest commit sync', async () => {
    execSpy.mockResolvedValue(0)
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    const swiftorg = new Swiftorg(commit)
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync', async () => {
    execSpy.mockResolvedValue(0)
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    process.env.SETUPSWIFT_SWIFTORG_METADATA = `{"commit": "${commit}"}`
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync with string value', async () => {
    execSpy.mockResolvedValue(0)
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    process.env.SETUPSWIFT_SWIFTORG_METADATA = `{"commit": "${commit}"}`
    const swiftorg = new Swiftorg('false')
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync with empty string value', async () => {
    execSpy.mockResolvedValue(0)
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    process.env.SETUPSWIFT_SWIFTORG_METADATA = `{"commit": "${commit}"}`
    const swiftorg = new Swiftorg('')
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync success with matadata fetch', async () => {
    execSpy.mockResolvedValue(0)
    process.env.SETUPSWIFT_SWIFTORG_METADATA = undefined
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    const swiftorg = new Swiftorg(false)
    nock(SWIFTORG_METADATA)
      .get(/.*/)
      .reply(200, {commit}, {'content-type': 'application/json'})
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync failure with matadata fetch failure', async () => {
    execSpy.mockResolvedValue(0)
    process.env.SETUPSWIFT_SWIFTORG_METADATA = undefined
    const statusCode = 404
    const swiftorg = new Swiftorg(false)
    nock(SWIFTORG_METADATA)
      .get(/.*/)
      .reply(statusCode, {}, {'content-type': 'application/json'})
    await expect(swiftorg.update()).rejects.toMatchObject(
      new Error(`Request Failed Status Code: '${statusCode}'`)
    )
    expect(execSpy).toHaveBeenCalledTimes(0)
  })

  it('tests without latest sync failure with invalid matadata content type', async () => {
    execSpy.mockResolvedValue(0)
    process.env.SETUPSWIFT_SWIFTORG_METADATA = undefined
    const contentType = 'application/txt'
    const swiftorg = new Swiftorg(false)
    nock(SWIFTORG_METADATA)
      .get(/.*/)
      .reply(200, {}, {'content-type': contentType})
    await expect(swiftorg.update()).rejects.toMatchObject(
      new Error(`Invalid content-type: '${contentType}'`)
    )
    expect(execSpy).toHaveBeenCalledTimes(0)
  })

  it('tests without latest sync failure with invalid matadata content', async () => {
    execSpy.mockResolvedValue(0)
    process.env.SETUPSWIFT_SWIFTORG_METADATA = undefined
    const swiftorg = new Swiftorg(false)
    nock(SWIFTORG_METADATA)
      .get(/.*/)
      .reply(200, 'invalid', {'content-type': 'application/json'})
    await expect(swiftorg.update()).rejects.toBeInstanceOf(SyntaxError)
    expect(execSpy).toHaveBeenCalledTimes(0)
  })
})
