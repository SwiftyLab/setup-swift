import os from 'os'
// @ts-ignore
import {__setos as setos} from 'getos'
import {ToolchainVersion} from '../src/version'
import {Platform} from '../src/platform'

jest.mock('getos')

describe('fetch all matching tool data based on options', () => {
  const ver5_5 = ToolchainVersion.create('5.5', false)
  const dev5_5 = ToolchainVersion.create('5.5', true)

  it('fetches macOS latest swift 5.5 tools', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(ver5_5)
    expect(tools.length).toBe(4)
  })

  it('fetches macOS latest swift 5.5 tools including dev snapshot', async () => {
    setos({os: 'darwin', dist: 'macOS', release: '21'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(dev5_5)
    expect(tools.length).toBe(103)
  })

  it('fetches ubuntu 18.04 latest swift 5.5 tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(ver5_5)
    expect(tools.length).toBe(4)
  })

  it('fetches ubuntu 18.04 latest swift 5.5 tools including dev snapshot', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '18.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(dev5_5)
    expect(tools.length).toBe(103)
  })

  it('fetches windows 10 latest swift 5.5 tools', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(ver5_5)
    expect(tools.length).toBe(4)
  })

  it('fetches windows 10 latest swift 5.5 tools including dev snapshot', async () => {
    setos({os: 'win32', dist: 'Windows', release: '10.0.17063'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const tools = await Platform.toolchains(dev5_5)
    expect(tools.length).toBe(34)
  })

  it('fetches ubuntu 16.04 latest swift 5.6 tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '16.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const ver5_6_1 = ToolchainVersion.create('5.6.1', false)
    const tools = await Platform.toolchains(ver5_6_1)
    expect(tools.length).toBe(2)
  })

  it('fetches ubuntu 20.04 latest swift 5.2 tools', async () => {
    setos({os: 'linux', dist: 'Ubuntu', release: '20.04'})
    jest.spyOn(os, 'arch').mockReturnValue('x64')
    const ver5_2 = ToolchainVersion.create('5.2', false)
    const tools = await Platform.toolchains(ver5_2)
    expect(tools.length).toBe(2)
  })
})
