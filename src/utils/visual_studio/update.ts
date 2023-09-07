import * as os from 'os'
import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import {VisualStudio} from './setup'

declare module './setup' {
  // eslint-disable-next-line no-shadow
  export interface VisualStudio {
    update(sdkroot: string): Promise<void>
  }
}

/// Update swift version based additional support files setup
VisualStudio.prototype.update = async function (sdkroot: string) {
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
