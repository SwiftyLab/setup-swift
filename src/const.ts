import * as path from 'path'

export const MODULE_DIR = path.dirname(__dirname)
export const SWIFTORG = 'swiftorg'
export const SWIFTORG_ORIGIN = 'https://github.com/apple/swift-org-website.git'
export const SWIFTORG_METADATA =
  'https://swiftylab.github.io/setup-swift/metadata.json'

// Common Inputs
export const INPUT_CACHE_SNAPSHOT = 'cache-snapshot'
export const INPUT_SWIFT_VERSION = 'swift-version'
export const INPUT_CHECK_LATEST = 'check-latest'
export const INPUT_DEVELOPMENT = 'development'
export const INPUT_DRY_RUN = 'dry-run'
export const INPUT_SDKS = 'sdks'

// For macOS
export const INPUT_PREFER_OSS_TOOLCHAIN = 'prefer-oss-toolchain'

// For Windows
export const INPUT_UPDATE_SDK_MODULES = 'update-sdk-modules'
export const INPUT_VISUAL_STUDIO_COMPONENTS = 'visual-studio-components'
export const INPUT_PREFER_VISUAL_STUDIO_LINKER = 'prefer-visual-studio-linker'

// Outputs
export const OUTPUT_SWIFT_VERSION = 'swift-version'
export const OUTPUT_TOOLCHAIN = 'toolchain'
export const OUTPUT_SDKS = 'sdks'
