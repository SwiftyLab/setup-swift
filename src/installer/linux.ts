import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import * as toolCache from '@actions/tool-cache'
import {VerifyingToolchainInstaller} from './verify'
import {LinuxToolchainSnapshot} from '../snapshot'
import {MODULE_DIR} from '../const'

export class LinuxToolchainInstaller extends VerifyingToolchainInstaller<LinuxToolchainSnapshot> {
  private async installDependencies() {
    const platform = this.data.platform
    const linuxRequirements = 'swiftorg/_includes/linux'
    const file = path.join(MODULE_DIR, linuxRequirements, `${platform}.html`)
    try {
      await fs.access(file)
    } catch (error) {
      core.debug(`Skipping dependencies install due to "${error}"`)
      return
    }
    const content = await fs.readFile(file, 'utf-8')
    const match = /(?=\$)[^{]+/gs.exec(content)
    if (!match) {
      core.debug(`Skipping dependencies install as no match in "${content}"`)
      return
    }
    const commands = match[0].split('\n').flatMap(line => {
      const command = line
        .trim()
        .replace(/^\\+|\\+$|^\$+|\$+$/g, '')
        .trim()
      return command.length ? command : []
    })
    if (!commands.length) {
      core.debug(`Skipping dependencies install as no commands in "${content}"`)
      return
    }
    try {
      // TODO: make update generalized accross linux platforms
      await exec('sudo', ['apt-get', 'update'])
      await exec('sudo', [...commands, '-y'])
    } catch (error) {
      core.debug(`Dependencies installation failed with "${error}"`)
    }
  }

  protected async download() {
    const [, archive] = await Promise.all([
      this.installDependencies(),
      super.download()
    ])
    return archive
  }

  protected async unpack(archive: string) {
    core.debug(`Extracting toolchain from "${archive}"`)
    const extractPath = await toolCache.extractTar(archive)
    core.debug(`Toolchain extracted to "${extractPath}"`)
    const archiveName = path.basename(this.data.download, '.tar.gz')
    return path.join(extractPath, archiveName)
  }

  protected async add(toolchain: string) {
    core.debug(`Adding toolchain "${toolchain}" to path`)
    const swiftPath = path.join(toolchain, 'usr', 'bin')
    core.addPath(swiftPath)
    core.debug(`Swift installed at "${swiftPath}"`)
  }
}
