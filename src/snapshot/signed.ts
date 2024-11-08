import {ToolchainSnapshot} from './base'

export interface SignedToolchainSnapshot extends ToolchainSnapshot {
  readonly download_signature?: string
}
