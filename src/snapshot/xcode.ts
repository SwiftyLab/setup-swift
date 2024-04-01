import {ToolchainSnapshot} from './base'

export interface XcodeToolchainSnapshot extends ToolchainSnapshot {
  readonly debug_info?: string
  readonly xcode?: string
}
