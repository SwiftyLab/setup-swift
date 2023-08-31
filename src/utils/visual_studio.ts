import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
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
export async function setupSupportFiles(
  visualStudio: VisualStudio,
  sdkroot: string
) {
  /// https://docs.microsoft.com/en-us/cpp/build/building-on-the-command-line?view=msvc-170
  const nativeToolsScriptx86 = path.join(
    visualStudio.installationPath,
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
  const vsEnvs = Object.fromEntries(
    stdout
      .split(os.EOL)
      .filter(s => s.indexOf('='))
      .map(s => s.trim())
      .map(s => s.split('=', 2))
      .filter(s => s.length === 2)
      .map(s => [s[0].trim(), s[1].trim()] as const)
  )
  const universalCRTSdkDir = vsEnvs.UniversalCRTSdkDir
  const uCRTVersion = vsEnvs.UCRTVersion
  const vCToolsInstallDir = vsEnvs.VCToolsInstallDir
  if (!(universalCRTSdkDir && uCRTVersion && vCToolsInstallDir)) {
    throw new Error(`Failed to find paths from "${JSON.stringify(vsEnvs)}"`)
  }

  const sdkshare = path.join(sdkroot, 'usr', 'share')
  const winsdk = path.join(universalCRTSdkDir, 'Include', uCRTVersion)
  const vcToolsInclude = path.join(vCToolsInstallDir, 'include')
  const vcModulemap = path.join(vcToolsInclude, 'module.modulemap')
  const uCRTmap = path.join(sdkshare, 'ucrt.modulemap')
  const winsdkMap = path.join(sdkshare, 'winsdk.modulemap')
  await fs.copyFile(uCRTmap, path.join(winsdk, 'ucrt', 'module.modulemap'))
  await fs.copyFile(winsdkMap, path.join(winsdk, 'um', 'module.modulemap'))
  try {
    const modulemap = path.join(sdkshare, 'vcruntime.modulemap')
    const runtimenotes = 'vcruntime.apinotes'
    const apinotes = path.join(sdkshare, runtimenotes)
    await fs.access(modulemap)
    await fs.copyFile(modulemap, vcModulemap)
    await fs.copyFile(apinotes, path.join(vcToolsInclude, runtimenotes))
  } catch (error) {
    core.debug(`Using visualc files for copy due to "${error}"`)
    const modulemap = path.join(sdkshare, 'visualc.modulemap')
    const runtimenotes = 'visualc.apinotes'
    const apinotes = path.join(sdkshare, runtimenotes)
    await fs.copyFile(modulemap, vcModulemap)
    await fs.copyFile(apinotes, path.join(vcToolsInclude, runtimenotes))
  }
  for (const property in vsEnvs) {
    if (vsEnvs[property] === process.env[property]) {
      continue
    }
    core.exportVariable(property, vsEnvs[property])
  }
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
  await exec(`"${vs.properties.setupEngineFilePath}"`, [
    'modify',
    '--installPath',
    vs.installationPath,
    ...requirement.components.flatMap(component => ['--add', component]),
    '--installWhileDownloading',
    '--force',
    '--quiet'
  ])
  return vs
}

/// Get vswhere and vs_installer paths
/// Borrowed from setup-msbuild action: https://github.com/microsoft/setup-msbuild
/// From source file: https://github.com/microsoft/setup-msbuild/blob/master/src/main.ts
export async function getVsWherePath() {
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
      const program86 = 'ProgramFiles(x86)'
      vswhereToolExe = path.join(
        process.env[program86] ?? path.join('C:', program86),
        'Microsoft Visual Studio',
        'Installer',
        'vswhere.exe'
      )
      core.debug(`Trying Visual Studio-installed path: ${vswhereToolExe}`)
    }
  }

  try {
    await fs.access(vswhereToolExe)
  } catch (error) {
    throw new Error('Missing vswhere.exe, needed Visual Studio installation')
  }

  return vswhereToolExe
}
