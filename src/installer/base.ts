import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
import {URL} from 'url'
import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import * as cache from '@actions/cache'
import * as toolCache from '@actions/tool-cache'
import {coerce as parseSemVer} from 'semver'
import {SWIFT_BRANCH_REGEX} from '../version'
import {ToolchainSnapshot} from '../snapshot'

export type SnapshotForInstaller<Installer> =
  Installer extends ToolchainInstaller<infer Snapshot extends ToolchainSnapshot>
    ? Snapshot
    : never

export abstract class ToolchainInstaller<Snapshot extends ToolchainSnapshot> {
  constructor(readonly data: Snapshot) {}

  protected get version() {
    const match = SWIFT_BRANCH_REGEX.exec(this.data.dir)
    return match && match.length > 1 ? parseSemVer(match[1]) : undefined
  }

  protected get baseUrl() {
    const data = this.data
    if (data.baseUrl) {
      return data.baseUrl
    }
    const base = 'https://download.swift.org'
    return new URL(path.posix.join(base, data.branch, data.platform, data.dir))
  }

  protected swiftVersionCommand() {
    return {
      bin: 'swift',
      args: ['--version']
    }
  }

  async install(arch: string) {
    const toolCacheKey = `${this.data.dir}-${this.data.platform}`
    const actionCacheKey = arch ? `${toolCacheKey}-${arch}` : toolCacheKey
    const version = this.version?.raw
    let tool: string | undefined
    let toolCacheHit = false
    let actionCacheHit = false
    if (version) {
      core.debug(
        `Finding tool with key: "${toolCacheKey}", version: "${version}" and arch: "${arch}" in tool cache`
      )
      tool = toolCache.find(toolCacheKey, version, arch).trim()
    }

    const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()
    const restore = path.join(tmpDir, 'setup-swift', toolCacheKey)
    if (!tool?.length) {
      if (await cache.restoreCache([restore], actionCacheKey)) {
        core.debug(
          `Restored snapshot at "${restore}" from key "${actionCacheKey}"`
        )
        tool = restore
        actionCacheHit = true
      } else {
        const resource = await this.download(arch)
        const installation = await this.unpack(resource, arch)
        core.debug(`Downloaded and installed snapshot at "${installation}"`)
        tool = installation
      }
    } else {
      core.debug(`Found tool at "${tool}" in tool cache`)
      actionCacheHit = true
      toolCacheHit = true
    }

    if (tool && version) {
      if (!toolCacheHit) {
        tool = await toolCache.cacheDir(tool, toolCacheKey, version, arch)
        core.debug(`Added to tool cache at "${tool}"`)
      }

      if (core.isDebug()) {
        core.exportVariable('SWIFT_SETUP_TOOL_KEY', toolCacheKey)
      }
    }
    if (
      tool &&
      core.getBooleanInput('cache-snapshot') &&
      !actionCacheHit &&
      !toolCacheHit &&
      !this.data.preventCaching
    ) {
      await fs.cp(tool, restore, {recursive: true})
      await cache.saveCache([restore], actionCacheKey)
      core.debug(`Saved to cache with key "${actionCacheKey}"`)
    }
    await this.add(tool, arch)
  }

  protected async download(arch: string) {
    const url = path.posix.join(this.baseUrl?.href, this.data.download)
    core.debug(`Downloading snapshot from "${url}" for architecture ${arch}`)
    return await toolCache.downloadTool(url)
  }

  protected abstract unpack(resource: string, arch: string): Promise<string>
  protected abstract add(installation: string, arch: string): Promise<void>

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
