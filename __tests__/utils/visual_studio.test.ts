import * as path from 'path'
import {promises as fs} from 'fs'
import * as io from '@actions/io'
import * as exec from '@actions/exec'
import * as vs from '../../src/utils/visual_studio'

describe('visual studio setup validation', () => {
  const env = process.env
  const visualStudio: vs.VisualStudio = {
    installationPath: path.join('C:', 'Visual Studio'),
    installationVersion: '16',
    catalog: {productDisplayVersion: '16'},
    properties: {
      setupEngineFilePath: path.join('C:', 'Visual Studio', 'setup.exe')
    }
  }

  beforeEach(() => {
    process.env = {...env}
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = env
  })

  it('tests vswhere path from environment variable', async () => {
    fsAccessMock()
    const vswhereExe = path.join('C:', 'Visual Studio', 'vswhere.exe')
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    expect(await vs.getVsWherePath()).toBe(vswhereExe)
  })

  it('tests vswhere path from @actions/io', async () => {
    fsAccessMock()
    const vswhereExe = path.join('C:', 'Visual Studio', 'vswhere.exe')
    jest.spyOn(io, 'which').mockResolvedValue(vswhereExe)
    expect(await vs.getVsWherePath()).toBe(vswhereExe)
  })

  it('tests fallback vswhere path', async () => {
    fsAccessMock()
    const vswhereExe = path.join(
      'C:',
      'Program Files (x86)',
      'Microsoft Visual Studio',
      'Installer',
      'vswhere.exe'
    )
    process.env['ProgramFiles(x86)'] = path.join('C:', 'Program Files (x86)')
    expect(await vs.getVsWherePath()).toBe(vswhereExe)
  })

  it('tests vswhere missing', async () => {
    fsAccessMock(false)
    await expect(vs.getVsWherePath()).rejects.toMatchObject(
      new Error('Missing vswhere.exe, needed Visual Studio installation')
    )
  })

  it('tests visual studio setup successfully', async () => {
    fsAccessMock()
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([visualStudio]),
      stderr: ''
    })
    await expect(
      vs.setupVisualStudioTools({version: '16', components: ['Component']})
    ).resolves.toMatchObject(visualStudio)
  })

  it('tests visual studio setup fails when invalid path', async () => {
    fsAccessMock()
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    jest.spyOn(exec, 'exec').mockResolvedValue(-1)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([{...visualStudio, installationPath: ''}]),
      stderr: ''
    })
    await expect(
      vs.setupVisualStudioTools({version: '16', components: ['Component']})
    ).rejects.toMatchObject(
      new Error(
        `Unable to find any Visual Studio installation for version: 16.`
      )
    )
  })

  it('tests visual studio setup fails with exit code', async () => {
    fsAccessMock()
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    jest.spyOn(exec, 'exec').mockResolvedValue(-1)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([visualStudio]),
      stderr: ''
    })
    await expect(
      vs.setupVisualStudioTools({version: '16', components: ['Component']})
    ).rejects.toMatchObject(
      new Error(
        `Visual Studio installer failed to install required components with exit code: -1.`
      )
    )
  })
})

function fsAccessMock(value = true) {
  const spy = jest.spyOn(fs, 'access')
  if (value) {
    spy.mockResolvedValue()
  } else {
    spy.mockRejectedValue(new Error())
  }
}
