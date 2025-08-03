import * as path from 'path'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {ToolchainInstaller} from './base'
import {SdkSnapshot} from '../snapshot'

export class SdkToolchainInstaller extends ToolchainInstaller<SdkSnapshot> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async unpack(resource: string, arch: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async add(installation: string, arch: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async install(arch: string) {
    const url = new URL(
      path.posix.join(this.baseUrl.pathname, this.data.download),
      this.baseUrl
    )
    core.startGroup(`Installing SDK ${url}`)
    const args = ['sdk', 'install', url.href]
    if (this.data.checksum) {
      args.push('--checksum', this.data.checksum)
    }
    await exec('swift', args)
    core.endGroup()
  }
}
