import {ToolchainSnapshot} from './base'

export interface SdkSnapshot extends ToolchainSnapshot {
  readonly checksum?: string
}
