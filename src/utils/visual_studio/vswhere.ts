import * as path from 'path'
import {promises as fs} from 'fs'
import * as io from '@actions/io'
import * as core from '@actions/core'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace VSWhere {
  /// Get vswhere and vs_installer paths
  /// Borrowed from setup-msbuild action: https://github.com/microsoft/setup-msbuild
  /// From source file: https://github.com/microsoft/setup-msbuild/blob/master/src/main.ts
  export async function get() {
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
}
