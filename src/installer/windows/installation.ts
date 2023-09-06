import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'

export class Installation {
  readonly location: string
  readonly toolchain: string
  readonly sdkroot: string
  readonly runtime: string
  readonly devdir?: string

  private constructor(
    location: string,
    toolchain: string,
    sdkroot: string,
    runtime: string,
    devdir?: string
  ) {
    this.location = location
    this.toolchain = toolchain
    this.sdkroot = sdkroot
    this.runtime = runtime
    this.devdir = devdir
  }

  static async get(location: string, fallback?: string) {
    let toolchain: string
    let sdkroot: string
    let runtime: string
    let devdir: string | undefined

    try {
      core.debug(`Checking for development snapshot installation`)
      toolchain = path.join(location, 'Toolchains', '0.0.0+Asserts')
      sdkroot = path.join(
        location,
        'Platforms',
        'Windows.platform',
        'Developer',
        'SDKs',
        'Windows.sdk'
      )
      runtime = path.join(location, 'Runtimes', '0.0.0')
      await fs.access(toolchain)
    } catch (error) {
      core.debug(`Switching to default installation due to "${error}"`)
      if (fallback) {
        location = fallback
      }
      devdir = path.join(location, 'Developer')
      toolchain = path.join(
        devdir,
        'Toolchains',
        'unknown-Asserts-development.xctoolchain'
      )
      sdkroot = path.join(
        devdir,
        'Platforms',
        'Windows.platform',
        'Developer',
        'SDKs',
        'Windows.sdk'
      )
      runtime = path.join(location, 'Swift', 'runtime-development')
    }
    return new Installation(location, toolchain, sdkroot, runtime, devdir)
  }

  static async detect() {
    const systemDrive = process.env.SystemDrive ?? 'C:'
    const defaultPath = path.join(systemDrive, 'Library')
    const devPath = path.join(systemDrive, 'Program Files', 'Swift')
    const installation = await Installation.get(devPath, defaultPath)
    if (path.relative(devPath, installation.location)) {
      const runtimeRoot = path.join(installation.location, 'Swift')
      try {
        await fs.access(devPath)
        await fs.cp(devPath, runtimeRoot, {recursive: true})
      } catch (error) {
        core.debug(`Runtime check failed with "${error}"`)
      }
    }
    core.debug(`Installation location at "${installation.location}"`)
    core.debug(`Toolchain installed at "${installation.toolchain}"`)
    core.debug(`SDK installed at "${installation.sdkroot}"`)
    core.debug(`Runtime installed at "${installation.runtime}"`)
    core.debug(`Development directory at "${installation.devdir}"`)
    return installation
  }
}
