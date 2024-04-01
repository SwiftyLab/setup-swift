import {URL} from 'url'

export interface ToolchainSnapshot {
  readonly name: string
  readonly date: Date
  readonly download: string
  readonly dir: string
  readonly platform: string
  readonly branch: string
  readonly baseUrl?: URL
  readonly preventCaching: boolean
}
