export interface SwiftRelease {
  readonly name: string
  readonly tag: string
  readonly date: Date
  readonly xcode: string
  readonly xcode_release: boolean
  readonly xcode_toolchain: boolean
  readonly platforms: SwiftRelease.Platform[]
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SwiftRelease {
  export interface Platform {
    readonly name: string
    readonly platform: string
    readonly archs: string[]
    readonly dir?: string
    readonly docker?: string
    readonly checksum?: string
  }
}
