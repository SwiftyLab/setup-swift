import {ToolchainSnapshot} from './base'

export interface XcodeToolchainSnapshot extends ToolchainSnapshot {
  readonly symbols?: string
  readonly xcode?: string
}
