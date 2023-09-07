import * as core from '@actions/core'
import {exec, getExecOutput} from '@actions/exec'
import {VisualStudio, VisualStudioRequirement} from './base'
import {VSWhere} from './vswhere'

declare module './base' {
  // eslint-disable-next-line no-shadow
  export namespace VisualStudio {
    function setup(requirement: VisualStudioRequirement): Promise<VisualStudio>
  }
}

let shared: VisualStudio

/// set up required visual studio tools for swift on windows
VisualStudio.setup = async function (requirement: VisualStudioRequirement) {
  if (shared) {
    return shared
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
  const vs = VisualStudio.createFromJSON(JSON.parse(stdout)[0])
  if (!vs.installationPath) {
    throw new Error(
      `Unable to find any Visual Studio installation for version: ${requirement.version}.`
    )
  }

  const vsEnv = await vs.env()
  const comps = requirement.components
  if (
    vsEnv.UCRTVersion &&
    vsEnv.UniversalCRTSdkDir &&
    vsEnv.VCToolsInstallDir &&
    comps.length < 3
  ) {
    core.debug('VS components already setup, skipping installation')
    shared = vs
    return vs
  }

  /// https://docs.microsoft.com/en-us/visualstudio/install/use-command-line-parameters-to-install-visual-studio?view=vs-2022
  /// install required visual studio components
  core.debug(`Installing VS components "${comps}" at "${vs.installationPath}"`)
  await exec(`"${vs.properties.setupEngineFilePath}"`, [
    'modify',
    '--installPath',
    vs.installationPath,
    ...requirement.components.flatMap(component => ['--add', component]),
    '--installWhileDownloading',
    '--force',
    '--quiet'
  ])
  shared = vs
  return vs
}
