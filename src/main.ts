import * as core from '@actions/core'
import {ToolchainVersion, SWIFT_BRANCH_REGEX} from './version'
import {Swiftorg} from './swiftorg'
import {SdkSnapshot, ToolchainSnapshot} from './snapshot'
import {Platform} from './platform'
import {
  INPUT_SWIFT_VERSION,
  INPUT_CHECK_LATEST,
  INPUT_DEVELOPMENT,
  INPUT_DRY_RUN,
  INPUT_SDKS,
  OUTPUT_SWIFT_VERSION,
  OUTPUT_TOOLCHAIN,
  OUTPUT_SDKS
} from './const'

export async function run() {
  try {
    const requestedVersion = core.getInput(INPUT_SWIFT_VERSION) ?? 'latest'
    const development = core.getBooleanInput(INPUT_DEVELOPMENT)
    const sdksStr = core.getInput(INPUT_SDKS)
    const sdks = sdksStr ? sdksStr.split(';') : []
    const version = ToolchainVersion.create(requestedVersion, development, sdks)

    if (version.requiresSwiftOrg) {
      core.startGroup('Syncing swift.org data')
      const checkLatest = core.getInput(INPUT_CHECK_LATEST)
      const submodule = new Swiftorg(checkLatest)
      await submodule.update()
      core.endGroup()
    }

    const dryRun = core.getBooleanInput(INPUT_DRY_RUN)
    let snapshot: ToolchainSnapshot
    let sdkSnapshots: SdkSnapshot[]
    let installedVersion: string
    if (dryRun) {
      const toolchain = await Platform.toolchain(version)
      if (toolchain) {
        snapshot = toolchain
      } else {
        throw new Error(`No Swift toolchain found for ${version}`)
      }
      const match = SWIFT_BRANCH_REGEX.exec(toolchain.branch)
      if (match && match.length > 1) {
        installedVersion = match[1]
      } else {
        installedVersion = requestedVersion
      }
      sdkSnapshots = (await version.sdkSnapshots(toolchain)).map(snapshot => {
        if (snapshot[0] == undefined) {
          throw new Error(`Unable to find SDK for ${snapshot[1]}`)
        }
        return snapshot[0]
      })
    } else {
      const {installer, sdkInstallers} = await Platform.install(version)
      snapshot = installer.data
      sdkSnapshots = sdkInstallers.map(installer => installer.data)
      installedVersion = await installer.installedSwiftVersion()
    }

    core.setOutput(OUTPUT_SWIFT_VERSION, installedVersion)
    core.setOutput(OUTPUT_TOOLCHAIN, JSON.stringify(snapshot))
    core.setOutput(OUTPUT_SDKS, JSON.stringify(sdkSnapshots))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

if (process.env.JEST_WORKER_ID === undefined) {
  run()
}
