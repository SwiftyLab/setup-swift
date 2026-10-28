import {spawn} from 'child_process'
import * as core from '@actions/core'
import * as io from '@actions/io'
import * as toolCache from '@actions/tool-cache'

const KEYSERVER = 'hkps://keyserver.ubuntu.com:443'
const GPG_TIMEOUT = 60_000
const GPG_KILL_DELAY = 10_000

async function execGpg(args: string[]): Promise<void> {
  const gpg = await io.which('gpg', true)
  core.info(`[command]${gpg} ${args.join(' ')}`)
  await new Promise<void>((resolve, reject) => {
    // Inherit output streams so a child keeping a pipe open cannot block exit.
    const child = spawn(gpg, args, {
      stdio: ['ignore', 'inherit', 'inherit'],
      windowsHide: true
    })
    let timedOut = false
    let killTimer: ReturnType<typeof setTimeout> | undefined
    const timeout = setTimeout(() => {
      timedOut = true
      core.warning('GPG command timed out after 60 seconds; terminating')
      killTimer = setTimeout(() => child.kill('SIGKILL'), GPG_KILL_DELAY)
      child.kill('SIGTERM')
    }, GPG_TIMEOUT)

    function cleanup() {
      clearTimeout(timeout)
      clearTimeout(killTimer)
    }

    child.once('error', error => {
      cleanup()
      reject(error)
    })
    child.once('exit', (code, signal) => {
      cleanup()
      if (timedOut) {
        reject(new Error('GPG command timed out after 60 seconds'))
      } else if (code !== 0) {
        reject(
          new Error(
            signal
              ? `GPG command terminated by ${signal}`
              : `GPG command failed with exit code ${code}`
          )
        )
      } else {
        resolve()
      }
    })
  })
}

export async function setupKeys() {
  try {
    core.debug('Fetching verification PGP keys')
    const allKeys = 'https://swift.org/keys/all-keys.asc'
    const path = await toolCache.downloadTool(allKeys)
    core.debug('Importing verification PGP keys')
    await execGpg(['--import', path])
  } catch {
    core.debug('Using fallback PGP keys server')
    await execGpg([
      '--keyserver',
      KEYSERVER,
      '--recv-keys',
      '52BB 7E3D E28A 71BE 22EC  05FF EF80 A866 B47A 981F',
      '7463 A81A 4B2E EA1B 551F  FBCF D441 C977 412B 37AD',
      '1BE1 E29A 084C B305 F397  D62A 9F59 7F4D 21A5 6D5F',
      'A3BA FD35 56A5 9079 C068  94BD 63BC 1CFE 91D3 06C6',
      '5E4D F843 FB06 5D7F 7E24  FBA2 EF54 30F0 71E1 B235',
      '8513 444E 2DA3 6B7C 1659  AF4D 7638 F1FB 2B2B 08C4',
      'A62A E125 BBBF BB96 A6E0  42EC 925C C1CC ED3D 1561',
      '8A74 9566 2C3C D4AE 18D9  5637 FAF6 989E 1BC1 6FEA',
      'E813 C892 820A 6FA1 3755  B268 F167 DF1A CF9C E069'
    ])
  }

  core.debug('Refreshing verification PGP keys')
  await refreshKeys()
}

export async function verify(signaturePath: string, packagePath: string) {
  core.debug('Verifying PGP signature')
  await execGpg(['--verify', signaturePath, packagePath])
}

async function refreshKeys() {
  const pool = [KEYSERVER]

  for (const server of pool) {
    core.debug(`Refreshing keys from "${server}"`)
    // 1st try...
    if (await refreshKeysFromServer(server)) {
      core.debug(`Refreshed successfully from "${server}" on 1st attempt`)
      return
    }

    // 2nd try...
    if (await refreshKeysFromServer(server)) {
      core.debug(`Refreshed successfully from "${server}" on 2nd attempt`)
      return
    }
    core.debug(`Refreshing keys from "${server}" failed`)
  }

  throw new Error('Failed to refresh keys from any server in the pool')
}

async function refreshKeysFromServer(server: string) {
  try {
    await execGpg(['--keyserver', server, '--refresh-keys', 'Swift'])
    return true
  } catch (error) {
    core.warning(
      `Facing error "${error}" when trying to refresh keys from "${server}"`
    )
    return false
  }
}
