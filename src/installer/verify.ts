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
      if (this.signatureUrl) {
        core.debug(`Downloading snapshot signature from "${this.signatureUrl}"`)
        return await toolCache.downloadTool(this.signatureUrl)
      }
      return undefined
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

  protected async download(arch: string) {
    const sigUrl = this.signatureUrl
    const signature = await this.downloadSignature()
    async function setupKeys() {
      if (sigUrl && signature) {
        await gpg.setupKeys()
      }
    }

    const [, toolchain] = await Promise.all([setupKeys(), super.download(arch)])
    if (signature) {
      await gpg.verify(signature, toolchain)
    }
    return toolchain
  }
}
