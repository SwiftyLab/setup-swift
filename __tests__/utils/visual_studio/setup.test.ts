import * as path from 'path'
import {promises as fs} from 'fs'
import os from 'os'
import crypto from 'crypto'
import * as exec from '@actions/exec'
import {
  VisualStudio,
  VisualStudioConfig
} from '../../../src/utils/visual_studio'

describe('visual studio setup validation', () => {
  const env = process.env
  const visualStudio = VisualStudio.createFromJSON({
    installationPath: path.join('C:', 'Visual Studio'),
    installationVersion: '17',
    catalog: {productDisplayVersion: '17'},
    properties: {
      setupEngineFilePath: path.join('C:', 'Visual Studio', 'setup.exe')
    },
    components: [
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      'Microsoft.VisualStudio.Component.Windows11SDK.22621'
    ]
  })

  beforeEach(() => {
    process.env = {...env}
    VisualStudio.shared = undefined
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = env
    VisualStudio.shared = undefined
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
      VisualStudio.setup({version: '16', components: visualStudio.components})
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
      VisualStudio.setup({version: '16', components: visualStudio.components})
    ).resolves.toMatchObject(visualStudio)
    expect(VisualStudio.shared).toStrictEqual(visualStudio)
  })

  it('tests visual studio duplicate setup', async () => {
    VisualStudio.shared = visualStudio
    const fsAccessSpy = jest.spyOn(fs, 'access')
    const execSpy = jest.spyOn(exec, 'exec')
    const getExecOutputSpy = jest.spyOn(exec, 'getExecOutput')
    await expect(
      VisualStudio.setup({version: '16', components: visualStudio.components})
    ).resolves.toMatchObject(visualStudio)
    expect(VisualStudio.shared).toBe(visualStudio)
    for (const spy of [fsAccessSpy, execSpy, getExecOutputSpy]) {
      expect(spy).not.toHaveBeenCalled()
    }
  })

  it('tests visual studio setup successfully skipping components installation', async () => {
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    const ucrtVersion = '1'
    const ucrtSdkDir = path.join('C:', 'UniversalCRTSdkDir')
    const vcToolsInstallDir = path.join('C:', 'VCToolsInstallDir')
    const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()
    const configId = '792a1d5c-ef88-45da-858c-baf3e6e0d048'
    const configFileName = `swift-setup-installation-${configId}.vsconfig`
    const vsConfig: VisualStudioConfig = {
      version: visualStudio.installationVersion,
      components: visualStudio.components
    }

    jest.spyOn(fs, 'access').mockResolvedValue()
    jest.spyOn(exec, 'exec').mockResolvedValue(0)
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(configId)
    jest
      .spyOn(exec, 'getExecOutput')
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: JSON.stringify([visualStudio]),
        stderr: ''
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: `UniversalCRTSdkDir=${ucrtSdkDir}\nUCRTVersion=${ucrtVersion}\nVCToolsInstallDir=${vcToolsInstallDir}`,
        stderr: ''
      })
    const readFileSpy = jest.spyOn(fs, 'readFile')
    readFileSpy.mockResolvedValue(JSON.stringify(vsConfig))

    await expect(
      VisualStudio.setup({version: '16', components: visualStudio.components})
    ).resolves.toMatchObject(visualStudio)
    expect(readFileSpy.mock.calls[0][0]).toBe(path.join(tmpDir, configFileName))
    expect(VisualStudio.shared).toStrictEqual(visualStudio)
  })

  it('tests visual studio environment setup', async () => {
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const execSpy = jest.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: ''
    })
    await visualStudio.env()
    const arg = execSpy.mock.calls.at(0)
    expect(arg).toBeTruthy()
    expect(arg?.[0]).toBe('cmd')
    expect(arg?.[1]).toStrictEqual([
      '/k',
      path.join(
        visualStudio.installationPath,
        'Common7',
        'Tools',
        'VsDevCmd.bat'
      ),
      '-arch=x64',
      '-winsdk=10.0.22621.0',
      '&&',
      'set',
      '&&',
      'exit'
    ])
  })
})
