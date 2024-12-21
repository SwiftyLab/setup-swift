import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {glob} from 'glob'
import {VersionedPlatform} from './versioned'
import {ToolchainVersion} from '../version'
import {LinuxToolchainSnapshot, ToolchainSnapshot} from '../snapshot'
import {LinuxToolchainInstaller} from '../installer'
import {MODULE_DIR} from '../const'

export class LinuxPlatform extends VersionedPlatform<LinuxToolchainInstaller> {
  protected get downloadExtension() {
    return 'tar.gz'
  }

  private async html() {
    const doc = path.join(MODULE_DIR, 'swiftorg', 'download', 'index.md')
    const content = await fs.readFile(doc, 'utf8')
    return content
  }

  snapshotFor(snapshot: ToolchainSnapshot) {
    return {...snapshot, download_signature: `${snapshot.download}.sig`}
  }

  async tools(version: ToolchainVersion) {
    const tools = await super.tools(version)
    try {
      const vGlob = `${this.version}`.split('').join('*')
      const index = ['linux', this.name, vGlob, 'index.md']
      const doc = path.join('swiftorg', 'install', ...index)
      const file = (await glob(doc, {absolute: true, cwd: MODULE_DIR}))[0]
      if (!file) {
        return tools
      }

      const content = await fs.readFile(file, 'utf8')
      const branchPattern = /branch_dir(.*)="(.+)"/g
      const branchResults = content.matchAll(branchPattern)
      const startPattern = /<\/details>/g // only search string after this tag
      startPattern.exec(content)
      for (const result of branchResults) {
        const tIndex = tools.findIndex(tool => tool.branch === result[2])
        const dTagPattern = new RegExp(`docker_tag${result[1]}="(.+)"`, 'g')
        dTagPattern.lastIndex = startPattern.lastIndex
        const dMatch = dTagPattern.exec(content)
        if (tIndex >= 0 && dMatch?.length) {
          tools[tIndex] = {...tools[tIndex], docker: dMatch[1]}
        }
      }
    } catch (error) {
      core.warning(`Skippping development tools docker metadata for "${error}"`)
    }
    return tools
  }

  async install(data: LinuxToolchainSnapshot) {
    const installer = new LinuxToolchainInstaller(data)
    await installer.install(this.arch)
    return installer
  }
}
