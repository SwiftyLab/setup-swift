import {exec} from '@actions/exec'

export class PackageManager {
  constructor(readonly installationCommands: string[]) {}

  get name() {
    return this.installationCommands[0]
  }

  protected async update() {
    await exec('sudo', [this.name, 'update'])
  }

  async install() {
    await this.update()
    await exec('sudo', [...this.installationCommands, '-y'])
  }
}
