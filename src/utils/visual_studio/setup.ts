import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
import {randomUUID} from 'crypto'
import * as core from '@actions/core'
import {exec, getExecOutput} from '@actions/exec'
import {VisualStudio, VisualStudioRequirement, VisualStudioConfig} from './base'
import {VSWhere} from './vswhere'

declare module './base' {
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-namespace
  export namespace VisualStudio {
    let shared: VisualStudio | undefined
    function setup(requirement: VisualStudioRequirement): Promise<VisualStudio>
  }
}

/// set up required visual studio tools for swift on windows
VisualStudio.setup = async function (requirement: VisualStudioRequirement) {
  if (this.shared) {
    return this.shared
  }
  /// https://github.com/microsoft/vswhere/wiki/Find-MSBuild
  /// get visual studio properties
  const vswhereExe = await VSWhere.get()

  // execute the find putting the result of the command in the options vsInstallPath
  core.debug(
    `Fetching Visual Studio installation for version "${requirement.version}"`
  )
  const {stdout} = await getExecOutput(`"${vswhereExe}"`, [
    '-products',
    '*',
    '-format',
    'json',
    '-utf8',
    '-latest',
    '-version',
    requirement.version
  ])
  const vs = VisualStudio.createFromJSON({
    ...JSON.parse(stdout)[0],
    components: requirement.components
  })
  if (!vs.installationPath) {
    throw new Error(
      `Unable to find any Visual Studio installation for version: ${requirement.version}.`
    )
  }

  const vsEnv = await vs.env()
  let comps = requirement.components
  if (
    vsEnv.UCRTVersion &&
    vsEnv.UniversalCRTSdkDir &&
    vsEnv.VCToolsInstallDir
  ) {
    const tmpDir = process.env.RUNNER_TEMP || os.tmpdir()
    const configFileName = `swift-setup-installation-${randomUUID()}.vsconfig`
    const configPath = path.join(tmpDir, configFileName)
    core.debug(`Exporting VS installation config to "${configPath}"`)
    await exec(`"${vs.properties.setupEngineFilePath}"`, [
      'export',
      ...vs.defaultOptions,
      '--config',
      configPath
    ])

    const configContent = await fs.readFile(configPath, 'utf-8')
    core.debug(`Exported configuration data: "${configContent}"`)
    const vsConfig: VisualStudioConfig = JSON.parse(configContent)
    const installedComponents = new Set(vsConfig.components)
    comps = comps.filter(comp => !installedComponents.has(comp))
    if (comps.length == 0) {
      core.debug('VS components already setup, skipping installation')
      this.shared = vs
      return vs
    }
  }

  /// https://docs.microsoft.com/en-us/visualstudio/install/use-command-line-parameters-to-install-visual-studio?view=vs-2022
  /// install required visual studio components
  core.debug(`Installing VS components "${comps}" at "${vs.installationPath}"`)
  await exec(`"${vs.properties.setupEngineFilePath}"`, [
    'modify',
    ...vs.defaultOptions,
    ...requirement.components.flatMap(component => ['--add', component]),
    '--installWhileDownloading',
    '--force'
  ])
  this.shared = vs
  return vs
}
