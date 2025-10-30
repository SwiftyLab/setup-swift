import * as path from 'path'
import * as https from 'https'
import * as core from '@actions/core'
import {promises as fs} from 'fs'

interface ModuleDefinition {
  url: string
  destination: string
}

interface ModuleDefinitions {
  [key: string]: ModuleDefinition
}

/**
 * Updates SDK module definitions to latest version
 */
export async function updateSdkModules(sdkRoot: string): Promise<void> {
  core.startGroup('Updating SDK module definitions to latest version')

  // Get Swift root directory
  let swiftPath: string | undefined
  for (const p of process.env.PATH?.split(path.delimiter) ?? []) {
    swiftPath = path.join(
      p,
      process.platform === 'win32' ? 'swift.exe' : 'swift'
    )
    try {
      await fs.access(swiftPath)
      break
    } catch {
      swiftPath = undefined
      continue
    }
  }

  if (!swiftPath) {
    throw new Error('Swift command not found in PATH')
  }

  const swiftRoot = path.dirname(path.dirname(swiftPath))
  const moduleDefinitions: ModuleDefinitions = {
    '(Legacy) WinSDK Module Map': {
      url: 'https://raw.githubusercontent.com/swiftlang/swift/main/stdlib/public/Platform/winsdk_um.modulemap',
      destination: path.join(sdkRoot, 'usr', 'share', 'winsdk.modulemap')
    },
    'WinSDK(UM) Module Map': {
      url: 'https://raw.githubusercontent.com/swiftlang/swift/main/stdlib/public/Platform/winsdk_um.modulemap',
      destination: path.join(sdkRoot, 'usr', 'share', 'winsdk_um.modulemap')
    },
    'WinSDK(Shared) Module Map': {
      url: 'https://raw.githubusercontent.com/swiftlang/swift/main/stdlib/public/Platform/winsdk_shared.modulemap',
      destination: path.join(sdkRoot, 'usr', 'share', 'winsdk_shared.modulemap')
    },
    'UCRT Module Map': {
      url: 'https://raw.githubusercontent.com/swiftlang/swift/main/stdlib/public/Platform/ucrt.modulemap',
      destination: path.join(sdkRoot, 'usr', 'share', 'ucrt.modulemap')
    },
    'VCRuntime Module Map': {
      url: 'https://raw.githubusercontent.com/swiftlang/swift/main/stdlib/public/Platform/vcruntime.modulemap',
      destination: path.join(sdkRoot, 'usr', 'share', 'vcruntime.modulemap')
    },
    'VCRuntime API Notes': {
      url: 'https://raw.githubusercontent.com/swiftlang/swift/main/stdlib/public/Platform/vcruntime.apinotes',
      destination: path.join(sdkRoot, 'usr', 'share', 'vcruntime.apinotes')
    },
    'Clang Module Map': {
      url: 'https://raw.githubusercontent.com/llvm/llvm-project/main/clang/lib/Headers/module.modulemap',
      destination: path.join(
        swiftRoot,
        'lib',
        'swift',
        'clang',
        'include',
        'module.modulemap'
      )
    }
  }

  let createdDirectories: string[] = []
  for (const [name, definition] of Object.entries(moduleDefinitions)) {
    try {
      const destinationDir = path.dirname(definition.destination)
      if (!createdDirectories.includes(destinationDir)) {
        await fs.mkdir(destinationDir, {recursive: true})
        createdDirectories.push(destinationDir)
        core.debug(`Created directory ${destinationDir}`)
      } else {
        core.debug(`Directory ${destinationDir} already created`)
      }

      let downloadSuccess = false
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) {
          core.debug(`Waiting 5 seconds before retry for ${name}`)
          await new Promise(resolve => setTimeout(resolve, 5000))
        }

        try {
          const content = await new Promise<string>((resolve, reject) => {
            https.get(definition.url, res => {
              if (res.statusCode !== 200) {
                const error = new Error(
                  `Request Failed Status Code: '${res.statusCode}'`
                )
                core.error(error.message)
                res.resume()
                reject(error)
                return
              }

              let rawData = ''
              res.setEncoding('utf8')
              res.on('data', chunk => {
                rawData += chunk
              })

              res.on('end', () => {
                core.debug(`Recieved ${name} module definition: "${rawData}"`)
                resolve(rawData)
              })
            })
          })

          downloadSuccess = true
          await fs.writeFile(definition.destination, content)
          core.debug(
            `Updated ${name} module definition at ${definition.destination}`
          )
          break
        } catch (error) {
          core.warning(`Attempt ${attempt + 1} failed for ${name}: "${error}"`)
          if (downloadSuccess || attempt >= 2) {
            throw error
          }
        }
      }
    } catch (error) {
      core.error(`Failed to update ${name}: ${error}`)
      throw error
    }
  }
  core.endGroup()
}
