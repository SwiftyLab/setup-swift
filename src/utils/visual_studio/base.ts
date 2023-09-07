import * as os from 'os'
import * as path from 'path'
import {getExecOutput} from '@actions/exec'

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

  async env() {
    /// https://docs.microsoft.com/en-us/cpp/build/building-on-the-command-line?view=msvc-170
    const nativeToolsScriptx86 = path.join(
      this.installationPath,
      'Common7',
      'Tools',
      'VsDevCmd.bat'
    )
    const {stdout} = await getExecOutput(
      'cmd',
      [
        '/k',
        nativeToolsScriptx86,
        `-arch=${os.arch()}`,
        '&&',
        'set',
        '&&',
        'exit'
      ],
      {failOnStdErr: true}
    )
    return Object.fromEntries(
      stdout
        .split(os.EOL)
        .filter(s => s.indexOf('='))
        .map(s => s.trim())
        .map(s => s.split('=', 2))
        .filter(s => s.length === 2)
        .map(s => [s[0].trim(), s[1].trim()] as const)
    ) as VisualStudioEnv
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

export interface VisualStudioEnv {
  readonly UniversalCRTSdkDir?: string
  readonly UCRTVersion?: string
  readonly VCToolsInstallDir?: string
  readonly [name: string]: string | undefined
}
