import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {Installation, CustomInstallation} from './base'
import {firstDirectoryLayout, secondDirectoryLayout} from './approach'
import {env, fallback} from './fallback'

declare module './base' {
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-namespace
  export namespace Installation {
    let lastInstallation: Installation | CustomInstallation
    export function get(
      install?: string
    ): Promise<Installation | CustomInstallation | undefined>
    export function install(
      exe: string
    ): Promise<Installation | CustomInstallation>
    export function detect(
      oldEnv: Record<string, string>,
      newEnv: Record<string, string>
    ): Promise<Installation | CustomInstallation>
  }
}

Installation.get = async function (install?: string) {
  if (!(install?.length ?? 1)) {
    return this.lastInstallation
  }

  const approaches = [
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

Installation.install = async function (exe: string) {
  core.debug(`Installing toolchain from "${exe}"`)
  const oldEnv = await env()
  await exec(`"${exe}"`, ['-q'])
  const newEnv = await env()
  this.lastInstallation = await Installation.detect(oldEnv, newEnv)
  return this.lastInstallation
}

Installation.detect = async (
  oldEnv: Record<string, string>,
  newEnv: Record<string, string>
) => {
  const installation = await Installation.get()
  if (!installation) {
    return fallback(oldEnv, newEnv)
  }
  return installation
}

export * from './base'
