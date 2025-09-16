import * as os from 'os'
import * as core from '@actions/core'
import getos from 'getos'
import {ToolchainVersion} from '../version'
import {Platform} from './base'
import {XcodePlatform} from './xcode'
import {LinuxPlatform} from './linux'
import {WindowsPlatform} from './windows'
import {ToolchainSnapshot} from '../snapshot'
import {ToolchainInstaller, SdkToolchainInstaller} from '../installer'

declare module './base' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Platform {
    export function currentPlatform(): Promise<
      Platform<ToolchainInstaller<ToolchainSnapshot>>
    >
    export function toolchains(
      version: ToolchainVersion
    ): Promise<ToolchainSnapshot[]>
    export function toolchain(
      version: ToolchainVersion
    ): Promise<ToolchainSnapshot | undefined>
    export function install(version: ToolchainVersion): Promise<{
      installer: ToolchainInstaller<ToolchainSnapshot>
      sdkInstallers: SdkToolchainInstaller[]
    }>
  }
}

Platform.currentPlatform = async () => {
  const arch = os.arch()
  const _os: getos.Os = await new Promise((resolve, reject) => {
    getos((e, o) => {
      if (e) {
        reject(e)
        return
      }
      resolve(o)
    })
  })

  switch (_os.os) {
    case 'darwin':
      core.info(`Detected xcode platform with arch "${arch}"`)
      return new XcodePlatform(arch)
    case 'win32':
      core.info(`Detected windows platform with arch "${arch}"`)
      return new WindowsPlatform('windows', 10, arch)
    case 'linux': {
      const dist = _os.dist
      const release = _os.release
      const version = release.replaceAll(/\D/g, '')
      core.info(
        `Detected linux platform "${dist}" version "${release}" with arch "${arch}"`
      )
      return new LinuxPlatform(dist.toLowerCase(), parseInt(version), arch)
    }
    default:
      throw new Error(`OS ${_os.os} unsupported for Swift`)
  }
}

Platform.toolchains = async (version: ToolchainVersion) => {
  core.startGroup('Detecting current platform')
  const platform = await Platform.currentPlatform()
  core.endGroup()
  return await platform.tools(version)
}

Platform.toolchain = async (version: ToolchainVersion) => {
  const data = await Platform.toolchains(version)
  return data.length ? data[0] : undefined
}

Platform.install = async (version: ToolchainVersion) => {
  core.startGroup('Detecting current platform')
  const platform = await Platform.currentPlatform()
  core.endGroup()
  const toolchains = await platform.tools(version)
  if (!toolchains.length) {
    throw new Error(`No Swift toolchain found for ${version}`)
  }
  const toolchain = toolchains[0]
  core.startGroup(`Installing Swift toolchain snapshot ${toolchain.dir}`)
  const installer = await platform.install(toolchain)
  core.endGroup()

  const sdkInstallers: SdkToolchainInstaller[] = []
  for (const sdkSnapshot of await version.sdkSnapshots(toolchain)) {
    const sdkInstaller = new SdkToolchainInstaller(sdkSnapshot)
    await sdkInstaller.install(toolchain.platform)
    sdkInstallers.push(sdkInstaller)
  }
  return {installer, sdkInstallers}
}

export * from './base'
export * from './versioned'
export * from './linux'
export * from './windows'
export * from './xcode'
