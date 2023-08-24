import {SignedToolchainSnapshot} from './signed'

export interface LinuxToolchainSnapshot extends SignedToolchainSnapshot {
  readonly docker?: string
}
