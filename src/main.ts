import * as core from '@actions/core'
import {ToolchainVersion} from './version'
import {Swiftorg} from './swiftorg'
import {ToolchainSnapshot} from './snapshot'
import {Platform} from './platform'

async function run() {
  try {
    const requestedVersion = core.getInput('swift-version') ?? 'latest'
    const development = core.getBooleanInput('development')
    const version = ToolchainVersion.create(requestedVersion, development)

    core.startGroup('Syncing swift.org data')
    const checkLatest = core.getBooleanInput('check-latest')
    const submodule = new Swiftorg(checkLatest)
    await submodule.update()
    core.endGroup()

    const dryRun = core.getBooleanInput('development')
    let snapshot: ToolchainSnapshot
    let installedVersion: string
    if (dryRun) {
      const toolchain = await Platform.toolchain(version)
      if (toolchain) {
        snapshot = toolchain
      } else {
        throw new Error(`No Swift toolchain found for ${version}`)
      }
      installedVersion = requestedVersion
    } else {
      const installer = await Platform.install(version)
      snapshot = installer.data
      installedVersion = await installer.installedSwiftVersion()
    }
    core.setOutput('swift-version', installedVersion)
    core.setOutput('toolchain', JSON.stringify(snapshot))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
