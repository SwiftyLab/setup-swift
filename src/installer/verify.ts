import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import * as gpg from '../utils/gpg'
import {ToolchainInstaller} from './base'
import {SignedToolchainSnapshot} from '../snapshot/signed'

export abstract class VerifyingToolchainInstaller<
  Snapshot extends SignedToolchainSnapshot
> extends ToolchainInstaller<Snapshot> {
  protected async download() {
    const sigUrl = `${this.baseUrl}/${this.data.download_signature}`
    core.debug(`Downloading snapshot signature from "${sigUrl}"`)
    const [, toolchain, signature] = await Promise.all([
      gpg.setupKeys(),
      super.download(),
      toolCache.downloadTool(sigUrl)
    ])
    await gpg.verify(signature, toolchain)
    return toolchain
  }
}
