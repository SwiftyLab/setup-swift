import * as core from '@actions/core'
import {ToolchainVersion} from './version'
import {Swiftorg} from './swiftorg'
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

    const installer = await Platform.install(version)
    core.setOutput('swift-version', await installer.installedSwiftVersion())
    core.setOutput('toolchain', JSON.stringify(installer.data))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
