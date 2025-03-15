import * as os from 'os'
import * as path from 'path'
import {getExecOutput} from '@actions/exec'

export const VISUAL_STUDIO_WINSDK_COMPONENT_REGEX =
  /Microsoft\.VisualStudio\.Component\.Windows[0-9]+SDK\.([0-9]+)/

export class VisualStudio {
  private constructor(
    readonly installationPath: string,
    readonly installationVersion: string,
    readonly catalog: VisualStudioCatalog,
    readonly properties: VisualStudioProperties,
    readonly components: string[]
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createFromJSON(json: any) {
    return new VisualStudio(
      json.installationPath,
      json.installationVersion,
      json.catalog,
      json.properties,
      json.components
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

    const args = []
    const sdkComponentMatch = this.components
      .map(component => {
        return VISUAL_STUDIO_WINSDK_COMPONENT_REGEX.exec(component)
      })
      .filter(match => {
        return match && match.length > 1
      })
      .at(0)
    if (sdkComponentMatch) {
      args.push(`-winsdk=10.0.${sdkComponentMatch[1]}.0`)
    }

    const {stdout} = await getExecOutput(
      'cmd',
      [
        '/k',
        nativeToolsScriptx86,
        `-arch=${os.arch()}`,
        ...args,
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
