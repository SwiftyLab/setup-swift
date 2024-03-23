import * as path from 'path'
import {promises as fs} from 'fs'
import * as exec from '@actions/exec'
import {VisualStudio} from '../../../src/utils/visual_studio'

describe('visual studio setup validation', () => {
  const env = process.env
  const visualStudio = VisualStudio.createFromJSON({
    installationPath: path.join('C:', 'Visual Studio'),
    installationVersion: '17',
    catalog: {productDisplayVersion: '17'},
    properties: {
      setupEngineFilePath: path.join('C:', 'Visual Studio', 'setup.exe')
    }
  })

  beforeEach(() => {
    process.env = {...env}
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = env
  })

  it('tests visual studio setup fails when invalid path', async () => {
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(exec, 'exec').mockResolvedValue(-1)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([{...visualStudio, installationPath: ''}]),
      stderr: ''
    })
    await expect(
      VisualStudio.setup({version: '16', components: ['Component']})
    ).rejects.toMatchObject(
      new Error(
        `Unable to find any Visual Studio installation for version: 16.`
      )
    )
  })

  it('tests visual studio setup successfully', async () => {
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([visualStudio]),
      stderr: ''
    })
    await expect(
      VisualStudio.setup({version: '16', components: ['Component']})
    ).resolves.toMatchObject(visualStudio)
  })
})
