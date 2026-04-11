import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {Installation, CustomInstallation} from './base'
import {
  firstDirectoryLayout,
  secondDirectoryLayout,
  thirdDirectoryLayout
} from './approach'
import {env, fallback} from './fallback'

declare module './base' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Installation {
    let lastInstallation: Installation | CustomInstallation
    export function get(
      version: string,
      install?: string
    ): Promise<Installation | CustomInstallation | undefined>
    export function install(
      exe: string,
      version: string
    ): Promise<Installation | CustomInstallation>
    export function detect(
      oldEnv: Record<string, string>,
      newEnv: Record<string, string>,
      version: string
    ): Promise<Installation | CustomInstallation>
  }
}

Installation.get = async function (version: string, install?: string) {
  if (install?.length === 0) {
    return this.lastInstallation
  }

  const approaches = [
    async () => thirdDirectoryLayout(version, install),
    async () => secondDirectoryLayout(install),
    async () => firstDirectoryLayout(install)
  ]
  let counter = 0
  for (const approach of approaches) {
    counter += 1
    try {
      const installation = await approach()
      core.debug(`Installation location at "${installation.location}"`)
      core.debug(`Toolchain installed at "${installation.toolchain}"`)
      core.debug(`SDK installed at "${installation.sdkroot}"`)
      core.debug(`Runtime installed at "${installation.runtime}"`)
      core.debug(`Development directory at "${installation.devdir}"`)
      return installation
    } catch (error) {
      core.debug(`Failed ${counter} time(s), recent error "${error}"`)
    }
  }
  return undefined
}

Installation.install = async function (exe: string, version: string) {
  core.debug(`Installing toolchain from "${exe}"`)
  const oldEnv = await env()
  await exec(`"${exe}"`, ['-q'])
  const newEnv = await env()
  this.lastInstallation = await Installation.detect(oldEnv, newEnv, version)
  return this.lastInstallation
}

Installation.detect = async (
  oldEnv: Record<string, string>,
  newEnv: Record<string, string>,
  version: string
) => {
  const installation = await Installation.get(version)
  if (!installation) {
    return fallback(oldEnv, newEnv)
  }
  return installation
}

export * from './base'
