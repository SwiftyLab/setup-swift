import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import * as gpg from '../utils/gpg'
import {ToolchainInstaller} from './base'
import {SignedToolchainSnapshot} from '../snapshot'

export abstract class VerifyingToolchainInstaller<
  Snapshot extends SignedToolchainSnapshot
> extends ToolchainInstaller<Snapshot> {
  private get signatureUrl() {
    return `${this.baseUrl}/${this.data.download_signature}`
  }

  private async downloadSignature() {
    try {
      return await toolCache.downloadTool(this.signatureUrl)
    } catch (error) {
      if (
        error instanceof toolCache.HTTPError &&
        error.httpStatusCode === 404
      ) {
        return undefined
      }
      throw error
    }
  }

  protected async download() {
    const sigUrl = `${this.baseUrl}/${this.data.download_signature}`
    core.debug(`Downloading snapshot signature from "${sigUrl}"`)
    const [, toolchain, signature] = await Promise.all([
      gpg.setupKeys(),
      super.download(),
      this.downloadSignature()
    ])
    if (signature) {
      await gpg.verify(signature, toolchain)
    }
    return toolchain
  }
}
