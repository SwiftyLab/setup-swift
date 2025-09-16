export abstract class SdkRequirement {
  constructor(
    readonly platform: string,
    readonly version: string | undefined
  ) {}

  abstract get download(): string
  abstract get file(): string

  toString(): string {
    return this.version ? `${this.platform}:${this.version}` : this.platform
  }
}

export class StaticLinux extends SdkRequirement {
  constructor(version: string | undefined) {
    super('static-sdk', version)
  }

  get download(): string {
    const version =
      this.version && this.version.length > 0 ? this.version : '0.0.1'
    return `static-linux-${version}`
  }

  get file(): string {
    return 'static-sdk.yml'
  }
}

export class Wasm extends SdkRequirement {
  constructor(version: string | undefined) {
    super('wasm', version)
  }

  get download(): string {
    const versionSuffix =
      this.version && this.version.length > 0 ? `-${this.version}` : ''
    return `wasm${versionSuffix}`
  }

  get file(): string {
    return 'wasm-sdk.yml'
  }
}

export class DefaultSdk extends SdkRequirement {
  get download(): string {
    return this.platform
  }

  get file(): string {
    return `${this.platform}.yml`
  }
}
