import * as path from 'path'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {ToolchainInstaller} from './base'
import {SdkSnapshot} from '../snapshot'

export class SdkToolchainInstaller extends ToolchainInstaller<SdkSnapshot> {
  protected async unpack(_resource: string, _arch: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  protected async add(_installation: string, _arch: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async install(_arch: string, _hasSDKs: boolean) {
    const url = new URL(
      path.posix.join(this.baseUrl.pathname, this.data.download),
      this.baseUrl
    )
    core.startGroup(`Installing SDK ${url}`)
    const args = ['sdk', 'install', url.href]
    if (this.data.checksum) {
      args.push('--checksum', this.data.checksum)
    }

    for (let index = 1; index < 4; index++) {
      try {
        await exec('swift', args)
        break
      } catch (error) {
        core.debug(
          `Failed to install SDK ${url.href} with args ${args.join(' ')}: ${error}`
        )
        if (index === 3) {
          throw error
        }

        core.info(`Waiting ${1000 * index}ms before retrying`)
        await new Promise(resolve => setTimeout(resolve, 1000 * index))
        core.info(
          `Retrying to install SDK ${url.href} with args ${args.join(' ')}: ${index}`
        )
      }
    }

    core.endGroup()
  }
}
