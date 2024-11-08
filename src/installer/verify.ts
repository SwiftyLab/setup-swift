import {posix} from 'path'
import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import * as gpg from '../utils/gpg'
import {ToolchainInstaller} from './base'
import {SignedToolchainSnapshot} from '../snapshot'

export abstract class VerifyingToolchainInstaller<
  Snapshot extends SignedToolchainSnapshot
> extends ToolchainInstaller<Snapshot> {
  private get signatureUrl() {
    const signature = this.data.download_signature
    return signature ? posix.join(this.baseUrl.href, signature) : undefined
  }

  private async downloadSignature() {
    try {
      return this.signatureUrl
        ? await toolCache.downloadTool(this.signatureUrl)
        : undefined
    } catch (error) {
      if (
        error instanceof toolCache.HTTPError &&
        error.httpStatusCode === 404
      ) {
        core.warning(`No signature at "${this.signatureUrl}"`)
        return undefined
      }
      throw error
    }
  }

  protected async download() {
    const sigUrl = this.signatureUrl
    async function setupKeys() {
      if (sigUrl) {
        await gpg.setupKeys()
      }
    }

    core.debug(`Downloading snapshot signature from "${sigUrl}"`)
    const [, toolchain, signature] = await Promise.all([
      setupKeys(),
      super.download(),
      this.downloadSignature()
    ])
    if (signature) {
      await gpg.verify(signature, toolchain)
    }
    return toolchain
  }
}
