export interface ToolchainSnapshot {
  readonly name: string
  readonly date: Date
  readonly download: string
  readonly dir: string
  readonly platform: string
  readonly branch: string
}
