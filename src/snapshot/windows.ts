import {SignedToolchainSnapshot} from './signed'

export interface WindowsToolchainSnapshot extends SignedToolchainSnapshot {
  readonly windows: boolean
  readonly docker?: string
}
