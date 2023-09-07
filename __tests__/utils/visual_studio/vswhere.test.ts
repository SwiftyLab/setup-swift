import * as path from 'path'
import {promises as fs} from 'fs'
import * as io from '@actions/io'
import {VSWhere} from '../../../src/utils/visual_studio/vswhere'

describe('vswhere find validation', () => {
  const env = process.env

  beforeEach(() => {
    process.env = {...env}
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = env
  })

  it('tests vswhere path from environment variable', async () => {
    jest.spyOn(fs, 'access').mockResolvedValue()
    const vswhereExe = path.join('C:', 'Visual Studio', 'vswhere.exe')
    process.env.VSWHERE_PATH = path.join('C:', 'Visual Studio')
    expect(await VSWhere.get()).toBe(vswhereExe)
  })

  it('tests vswhere path from @actions/io', async () => {
    jest.spyOn(fs, 'access').mockResolvedValue()
    const vswhereExe = path.join('C:', 'Visual Studio', 'vswhere.exe')
    jest.spyOn(io, 'which').mockResolvedValue(vswhereExe)
    expect(await VSWhere.get()).toBe(vswhereExe)
  })

  it('tests fallback vswhere path', async () => {
    jest.spyOn(fs, 'access').mockResolvedValue()
    const vswhereExe = path.join(
      'C:',
      'Program Files (x86)',
      'Microsoft Visual Studio',
      'Installer',
      'vswhere.exe'
    )
    process.env['ProgramFiles(x86)'] = path.join('C:', 'Program Files (x86)')
    expect(await VSWhere.get()).toBe(vswhereExe)
  })

  it('tests vswhere missing', async () => {
    jest.spyOn(fs, 'access').mockRejectedValue(new Error())
    await expect(VSWhere.get()).rejects.toMatchObject(
      new Error('Missing vswhere.exe, needed Visual Studio installation')
    )
  })
})
