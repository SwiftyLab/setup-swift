import {ToolchainVersion} from './base'

export class LatestToolchainVersion extends ToolchainVersion {
  protected get dirGlob() {
    return `*`
  }

  protected get dirRegex() {
    return /.*/
  }

  toString() {
    return `latest ${this.dev ? 'dev ' : ''}version`
  }
}
