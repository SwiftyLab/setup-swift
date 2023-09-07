import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {VisualStudio} from './base'

declare module './base' {
  // eslint-disable-next-line no-shadow
  export interface VisualStudio {
    update(sdkroot: string): Promise<void>
  }
}

/// Update swift version based additional support files setup
VisualStudio.prototype.update = async function (sdkroot: string) {
  const vsEnv = await this.env()
  const universalCRTSdkDir = vsEnv.UniversalCRTSdkDir
  const uCRTVersion = vsEnv.UCRTVersion
  const vCToolsInstallDir = vsEnv.VCToolsInstallDir
  if (!(universalCRTSdkDir && uCRTVersion && vCToolsInstallDir)) {
    throw new Error(`Failed to find paths from "${JSON.stringify(vsEnv)}"`)
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
  for (const property in vsEnv) {
    if (vsEnv[property] === process.env[property]) {
      continue
    }
    core.exportVariable(property, vsEnv[property])
  }
}
