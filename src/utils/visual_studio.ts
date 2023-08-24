import * as fs from 'fs'
import * as path from 'path'
import * as io from '@actions/io'
import * as core from '@actions/core'
import {exec, getExecOutput} from '@actions/exec'

export interface VisualStudio {
  installationPath: string
  installationVersion: string
  catalog: VisualStudioCatalog
  properties: VisualStudioProperties
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

/// Do swift version based additional support files setup
export async function setupSupportFiles(visualStudio: VisualStudio) {
  /// https://docs.microsoft.com/en-us/cpp/build/building-on-the-command-line?view=msvc-170
  const nativeToolsScriptx86 = path.join(
    visualStudio.installationPath,
    'VC\\Auxiliary\\Build\\vcvars32.bat'
  )
  const copyCommands = [
    'copy /Y %SDKROOT%\\usr\\share\\ucrt.modulemap "%UniversalCRTSdkDir%\\Include\\%UCRTVersion%\\ucrt\\module.modulemap"',
    'copy /Y %SDKROOT%\\usr\\share\\visualc.modulemap "%VCToolsInstallDir%\\include\\module.modulemap"',
    'copy /Y %SDKROOT%\\usr\\share\\visualc.apinotes "%VCToolsInstallDir%\\include\\visualc.apinotes"',
    'copy /Y %SDKROOT%\\usr\\share\\winsdk.modulemap "%UniversalCRTSdkDir%\\Include\\%UCRTVersion%\\um\\module.modulemap"'
  ].join('&&')
  const code = await exec('cmd', ['/k', nativeToolsScriptx86], {
    failOnStdErr: true,
    input: Buffer.from(copyCommands, 'utf8')
  })
  core.debug(`Tried Windows SDK accessible to Swift, exited with code: ${code}`)
}

/// set up required visual studio tools for swift on windows
export async function setupVisualStudioTools(
  requirement: VisualStudioRequirement
) {
  /// https://github.com/microsoft/vswhere/wiki/Find-MSBuild
  /// get visual studio properties
  const vswhereExe = await getVsWherePath()

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
  const vs: VisualStudio = JSON.parse(stdout)[0]
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
  const code = await exec(`"${vs.properties.setupEngineFilePath}"`, [
    'modify',
    '--installPath',
    vs.installationPath,
    ...requirement.components.flatMap(component => ['--add', component]),
    '--quiet'
  ])
  if (code !== 0) {
    throw new Error(
      `Visual Studio installer failed to install required components with exit code: ${code}.`
    )
  }
  return vs
}

/// Get vswhere and vs_installer paths
/// Borrowed from setup-msbuild action: https://github.com/microsoft/setup-msbuild
/// From source file: https://github.com/microsoft/setup-msbuild/blob/master/src/main.ts
async function getVsWherePath() {
  // check to see if we are using a specific path for vswhere
  let vswhereToolExe = ''
  // Env variable for self-hosted runner to provide custom path
  const vsWherePath = process.env.VSWHERE_PATH

  if (vsWherePath) {
    // specified a path for vswhere, use it
    core.debug(`Using given vswhere-path: ${vsWherePath}`)
    vswhereToolExe = path.join(vsWherePath, 'vswhere.exe')
  } else {
    // check in PATH to see if it is there
    try {
      const vsWhereInPath: string = await io.which('vswhere', true)
      core.debug(`Found vswhere in path: ${vsWhereInPath}`)
      vswhereToolExe = vsWhereInPath
    } catch {
      // fall back to VS-installed path
      vswhereToolExe = path.join(
        process.env['ProgramFiles(x86)'] as string,
        'Microsoft Visual Studio',
        'Installer',
        'vswhere.exe'
      )
      core.debug(`Trying Visual Studio-installed path: ${vswhereToolExe}`)
    }
  }

  if (!fs.existsSync(vswhereToolExe)) {
    throw new Error('Missing vswhere.exe, needed Visual Studio installation')
  }

  return vswhereToolExe
}
