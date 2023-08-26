import {exec} from '@actions/exec'

export class PackageManager {
  readonly name: string
  readonly installationCommands: string[]

  constructor(installationCommands: string[]) {
    this.name = installationCommands[0]
    this.installationCommands = installationCommands
  }

  protected async update() {
    await exec('sudo', [this.name, 'update'])
  }

  async install() {
    await this.update()
    await exec('sudo', [...this.installationCommands, '-y'])
  }
}
