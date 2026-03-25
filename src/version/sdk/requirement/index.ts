import {SdkRequirement, StaticLinux, Wasm, Android, DefaultSdk} from './base'

declare module './base' {
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-namespace
  export namespace SdkRequirement {
    export function create(requirement: string): SdkRequirement
  }
}

SdkRequirement.create = function (requirement: string) {
  const [platform] = requirement.split(':', 2)

  switch (platform) {
    case 'static-sdk':
    case 'static-linux':
      return new StaticLinux()
    case 'wasm-sdk':
    case 'wasm':
      return new Wasm()
    case 'android-sdk':
    case 'android':
      return new Android()
    default:
      return new DefaultSdk(platform)
  }
}

export {SdkRequirement} from './base'
