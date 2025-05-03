import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import * as toolCache from '@actions/tool-cache'
import * as plist from 'plist'
import {ToolchainInstaller} from './base'
import {XcodeToolchainSnapshot} from '../snapshot'

export class XcodeToolchainInstaller extends ToolchainInstaller<XcodeToolchainSnapshot> {
  protected swiftVersionCommand(
    toolchain: string = process.env.TOOLCHAINS ?? ''
  ) {
    const toolchainArgs = toolchain.length ? ['--toolchain', toolchain] : []
    return {
      bin: 'xcrun',
      args: [...toolchainArgs, 'swift', '--version']
    }
  }

  async isInstallationNeeded() {
    const xcode = this.data.xcode
    if (!xcode) {
      core.debug('No Xcode version for toolchain, downloading toolchain')
      return true
    }

    const xcodeApp = `/Applications/Xcode_${xcode}.app`
    try {
      await fs.access(xcodeApp)
    } catch {
      core.debug(`Xcode ${xcode} is not installed, downloading toolchain`)
      return true
    }

    core.exportVariable('DEVELOPER_DIR', xcodeApp)
    await exec('sudo', ['xcode-select', '--switch', xcodeApp])
    const command = this.swiftVersionCommand('')
    const version = await this.installedSwiftVersion(command)
    core.debug(`Found toolchain "${version}" bundled with Xcode ${xcode}`)
    if (core.getBooleanInput('prefer-oss-toolchain')) {
      core.debug(`Giving preference to open source toolchain`)
      return true
    }
    return this.data.dir !== `swift-${version}-RELEASE`
  }

  async install(arch: string) {
    if (!(await this.isInstallationNeeded())) {
      return
    }
    await super.install(arch)
  }

  protected async download(arch: string) {
    const toolchain = await super.download(arch)
    core.debug(`Checking package signature for "${toolchain}"`)
    await exec('pkgutil', ['--check-signature', toolchain])
    return toolchain
  }

  protected async unpack(pkg: string, arch: string) {
    core.debug(`Extracting toolchain from "${pkg}" for architecture ${arch}`)
    const unpackedPath = await toolCache.extractXar(pkg)
    core.debug(`Toolchain unpacked to "${unpackedPath}"`)
    const pkgFile = this.data.download
    const pkgName = path.basename(pkgFile, path.extname(pkgFile))
    const payload = path.join(unpackedPath, `${pkgName}-package.pkg`, 'Payload')
    const extractedPath = await toolCache.extractTar(payload)
    core.debug(`Toolchain extracted to "${extractedPath}"`)
    return extractedPath
  }

  protected async add(toolchain: string, arch: string) {
    const xctoolchains = path.join('/Library', 'Developer', 'Toolchains')
    try {
      await fs.access(xctoolchains)
    } catch (error) {
      core.debug(`Creating directory "${xctoolchains}" resolving "${error}"`)
      await exec('sudo', ['mkdir', '-p', xctoolchains])
      // await fs.mkdir(xctoolchains, {recursive: true})
    }
    const xctoolchain = path.join(xctoolchains, `${this.data.dir}.xctoolchain`)
    try {
      await fs.access(xctoolchain)
      core.debug(`Removing existing xctoolchain "${xctoolchain}"`)
      await exec('sudo', ['rm', '-rf', xctoolchain])
      // await fs.unlink(xctoolchain)
    } catch (error) {
      core.debug(`No existing xctoolchain "${xctoolchain}", got "${error}"`)
    }
    core.debug(`Linking "${xctoolchain}" to "${toolchain}"`)
    await exec('sudo', ['ln', '-s', toolchain, xctoolchain])
    // await fs.symlink(toolchain, xctoolchain, 'dir')
    core.debug(`Adding toolchain "${toolchain}" to path`)
    const swiftPath = path.join(toolchain, 'usr', 'bin')
    core.addPath(swiftPath)
    core.debug(`Swift installed for architecture ${arch} at "${swiftPath}"`)
    const infoPlist = await fs.readFile(
      path.join(toolchain, 'Info.plist'),
      'utf-8'
    )
    const info = plist.parse(infoPlist).valueOf() as ToolchainInfo
    core.debug(
      `Setting Swift toolchain identifier to "${info.CFBundleIdentifier}"`
    )
    core.exportVariable('TOOLCHAINS', info.CFBundleIdentifier)
  }
}

interface ToolchainInfo {
  readonly CFBundleIdentifier: string
}
