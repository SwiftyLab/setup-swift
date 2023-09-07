import * as core from '@actions/core'
import {exec, getExecOutput} from '@actions/exec'
import {VSWhere} from './vswhere'

export class VisualStudio {
  private constructor(
    readonly installationPath: string,
    readonly installationVersion: string,
    readonly catalog: VisualStudioCatalog,
    readonly properties: VisualStudioProperties
  ) {}

  // eslint-disable-next-line no-explicit-any
  static createFromJSON(json: any) {
    return new VisualStudio(
      json.installationPath,
      json.installationVersion,
      json.catalog,
      json.properties
    )
  }
}

export interface VisualStudioCatalog {
  productDisplayVersion: string
}

export interface VisualStudioProperties {
  setupEngineFilePath: string
}

export interface VisualStudioRequirement {
  version: string
  components: string[]
}

// eslint-disable-next-line no-redeclare
export namespace VisualStudio {
  let self: VisualStudio

  /// set up required visual studio tools for swift on windows
  export async function setup(requirement: VisualStudioRequirement) {
    if (self) {
      return self
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

    /// https://docs.microsoft.com/en-us/visualstudio/install/use-command-line-parameters-to-install-visual-studio?view=vs-2022
    /// install required visual studio components
    core.debug(
      `Installing Visual Studio components "${requirement.components}" at "${vs.installationPath}"`
    )
    await exec(`"${vs.properties.setupEngineFilePath}"`, [
      'modify',
      '--installPath',
      vs.installationPath,
      ...requirement.components.flatMap(component => ['--add', component]),
      '--installWhileDownloading',
      '--force',
      '--quiet'
    ])
    self = vs
    return vs
  }
}
