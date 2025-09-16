import {SdkRequirement, StaticLinux, Wasm, DefaultSdk} from './base'

declare module './base' {
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-namespace
  export namespace SdkRequirement {
    export function create(requirement: string): SdkRequirement
  }
}

SdkRequirement.create = function (requirement: string) {
  const [platform, version] = requirement.split(':', 2)

  switch (platform) {
    case 'static-sdk':
    case 'static-linux':
      return new StaticLinux(version)
    case 'wasm-sdk':
    case 'wasm':
      return new Wasm(version)
    default:
      return new DefaultSdk(platform, version)
  }
}

export {SdkRequirement} from './base'
