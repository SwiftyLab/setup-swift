import * as os from 'os'
import * as path from 'path'
import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import * as cache from '@actions/cache'
import * as toolCache from '@actions/tool-cache'
import {coerce as parseSemVer} from 'semver'
import {ToolchainSnapshot} from '../snapshot'

export type SnapshotForInstaller<Installer> =
  Installer extends ToolchainInstaller<infer Snapshot extends ToolchainSnapshot>
    ? Snapshot
    : never

export class NoInstallationNeededError extends Error {}

export abstract class ToolchainInstaller<Snapshot extends ToolchainSnapshot> {
  constructor(readonly data: Snapshot) {}

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

  async install(arch?: string) {
    try {
      const key = `${this.data.branch}-${this.data.platform}`
      const version = this.version?.raw
      let tool: string | undefined
      if (version) {
        tool = toolCache.find(key, version, arch).trim()
      }
      if (!tool?.length) {
        const resource = await this.download()
        const installation = await this.unpack(resource)
        if (version) {
          tool = await toolCache.cacheDir(installation, key, version, arch)
        } else {
          core.debug('Proceeding without caching non-versioned snapshot')
          tool = installation
        }
      }
      await this.add(tool)
    } catch (error) {
      if (!(error instanceof NoInstallationNeededError)) {
        throw error
      }
    }
  }

  protected async download() {
    const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()
    let resourcePath = path.join(tmpDir, 'setup-swift', this.data.download)
    if (!(await cache.restoreCache([resourcePath], this.data.download))) {
      const url = `${this.baseUrl}/${this.data.download}`
      core.debug(`Downloading snapshot from "${url}"`)
      resourcePath = await toolCache.downloadTool(url)
      if (core.getBooleanInput('cache-snapshot')) {
        await cache.saveCache([resourcePath], this.data.download)
      }
    } else {
      core.debug(`Picked snapshot from cache key "${this.data.download}"`)
    }
    return resourcePath
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
