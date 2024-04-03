import * as path from 'path'
import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'

function comapareEnvironment(oldJSON: string, newJSON: string) {
  const difference: Record<string, string> = {}
  let newPaths: string[] = []
  let before: Record<string, string>
  let after: Record<string, string>
  try {
    before = JSON.parse(oldJSON)
    after = JSON.parse(newJSON)
    for (const [key, value] of Object.entries(after)) {
      const old = before[key]
      if (before[key] !== value) {
        if (key.toUpperCase() === 'PATH' && old) {
          newPaths = value
            .replace(old, '')
            .split(path.delimiter)
            .filter(item => item)
        } else {
          difference[key] = value
        }
      }
    }
  } catch (error) {
    core.error(`Environment variables serialization error "${error}"`)
  }
  return {newPaths, variables: difference}
}

export async function env() {
  return await ['Machine', 'User'].reduce(
    async (previous, current) => {
      const modified = await previous
      const command = `[Environment]::GetEnvironmentVariables('${current}') | ConvertTo-Json`
      const args = ['-NoProfile', '-Command', `& {${command}}`]
      const options = {failOnStdErr: true}
      const {stdout} = await getExecOutput('powershell', args, options)
      modified[current] = stdout
      return modified
    },
    Promise.resolve({} as Record<string, string>)
  )
}

export async function fallback(
  oldEnv: Record<string, string>,
  newEnv: Record<string, string>
) {
  core.debug('Procceding with fallback installation approach')
  const data = Object.entries(newEnv).reduce(
    (previous, current) => {
      return {
        ...previous,
        ...comapareEnvironment(oldEnv[current[0]], current[1])
      }
    },
    {} as {newPaths: string[]; variables: Record<string, string>}
  )
  core.debug(`Setting up environment with "${JSON.stringify(data)}"`)
  for (const newPath of data.newPaths) {
    core.addPath(newPath)
  }
  for (const pair of Object.entries(data.variables)) {
    core.exportVariable(pair[0], pair[1])
  }
}
