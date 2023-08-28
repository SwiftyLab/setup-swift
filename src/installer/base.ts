import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import * as toolCache from '@actions/tool-cache'
import {coerce as parseSemVer} from 'semver'
import {ToolchainSnapshot} from '../snapshot'

export type SnapshotForInstaller<Installer> =
  Installer extends ToolchainInstaller<infer Snapshot extends ToolchainSnapshot>
    ? Snapshot
    : never

export class NoInstallationNeededError extends Error {}

export abstract class ToolchainInstaller<Snapshot extends ToolchainSnapshot> {
  readonly data: Snapshot

  protected get version() {
    const match = /swift-(.*)-/.exec(this.data.branch)
    return match && match.length > 1 ? parseSemVer(match[1]) : undefined
  }

  protected get baseUrl() {
    return `https://download.swift.org/${this.data.branch}/${this.data.platform}/${this.data.dir}`
  }

  protected swiftVersionCommand() {
    return {
      bin: 'swift',
      args: ['--version']
    }
  }

  constructor(data: Snapshot) {
    this.data = data
  }

  async install(arch?: string) {
    try {
      const tool = `${this.data.branch}-${this.data.platform}`
      const version = this.version?.raw
      let cache: string | undefined
      if (version) {
        cache = toolCache.find(tool, version, arch).trim()
      }
      if (!cache?.length) {
        const resource = await this.download()
        const installation = await this.unpack(resource)
        if (version) {
          cache = await toolCache.cacheDir(installation, tool, version, arch)
        } else {
          core.debug('Proceeding without caching non-versioned snapshot')
          cache = installation
        }
      }
      await this.add(cache)
    } catch (error) {
      if (!(error instanceof NoInstallationNeededError)) {
        throw error
      }
    }
  }

  protected async download() {
    const url = `${this.baseUrl}/${this.data.download}`
    core.debug(`Downloading snapshot from "${url}"`)
    return await toolCache.downloadTool(url)
  }

  protected abstract unpack(resource: string): Promise<string>
  protected abstract add(installation: string): Promise<void>

  async installedSwiftVersion(command?: {bin: string; args: string[]}) {
    const {bin, args} = command ?? this.swiftVersionCommand()

    core.debug(`Getting swift version with command "${bin} ${args}"`)
    const {stdout} = await getExecOutput(bin, args)
    const match = /Swift\s+version\s+(?<version>\S+)/.exec(stdout)
    if (!match?.groups || !match.groups.version) {
      throw new Error('Error getting swift version')
    }
    return match.groups.version
  }
}
