import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {Installation} from './base'

export async function firstDirectoryLayout(root?: string) {
  core.debug('Trying first installation approach')
  const systemDrive = process.env.SystemDrive ?? 'C:'
  const location = root ?? path.join(systemDrive, 'Library')
  const devdir = path.join(location, 'Developer')
  const toolchainName = 'unknown-Asserts-development.xctoolchain'
  const toolchain = path.join(devdir, 'Toolchains', toolchainName)
  await fs.access(toolchain)
  const winsdk = path.join('Developer', 'SDKs', 'Windows.sdk')
  const sdkroot = path.join(devdir, 'Platforms', 'Windows.platform', winsdk)
  const runtimeRoot = path.join(location, 'Swift')
  const runtime = path.join(runtimeRoot, 'runtime-development')
  const devPath = path.join(systemDrive, 'Program Files', 'Swift')
  try {
    await fs.access(devPath)
    await fs.cp(devPath, runtimeRoot, {recursive: true})
  } catch (error) {
    core.debug(`Runtime check failed with "${error}"`)
  }
  core.debug('First installation approach succeeded')
  return new Installation(location, toolchain, sdkroot, runtime, devdir)
}

export async function secondDirectoryLayout(root?: string) {
  core.debug('Trying second installation approach')
  const systemDrive = root ?? process.env.SystemDrive ?? 'C:'
  const location = path.join(systemDrive, 'Program Files', 'Swift')
  const toolchainName = '0.0.0+Asserts'
  const toolchain = path.join(location, 'Toolchains', toolchainName)
  await fs.access(toolchain)
  const winsdk = path.join('Developer', 'SDKs', 'Windows.sdk')
  const sdkroot = path.join(location, 'Platforms', 'Windows.platform', winsdk)
  const runtime = path.join(location, 'Runtimes', '0.0.0')
  core.debug('Second installation approach succeeded')
  return new Installation(location, toolchain, sdkroot, runtime)
}
