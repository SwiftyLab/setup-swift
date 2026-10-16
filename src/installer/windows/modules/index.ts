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
  const sdkShare = path.join(sdkRoot, 'usr', 'share')

  // swiftlang/swift#e96bdab split WinSDK into `winsdk`, `um` and `shared`
  // module maps, with matching compiler changes. Toolchains predating it
  // expect `winsdk_um` and `winsdk_shared` instead, so pick definitions
  // matching the layout shipped with the installed toolchain.
  let splitLayout: boolean
  try {
    await fs.access(path.join(sdkShare, 'um.modulemap'))
    splitLayout = true
  } catch {
    splitLayout = false
  }

  const platformUrl = (file: string): string => {
    // Last `main` commit with module maps for toolchains predating the split
    const ref = splitLayout
      ? 'main'
      : '8bf8281136fa72aa85d72027fcecc31435359ad1'
    return `https://raw.githubusercontent.com/swiftlang/swift/${ref}/stdlib/public/Platform/${file}`
  }

  const winsdkModuleDefinitions: ModuleDefinitions = splitLayout
    ? {
        'WinSDK Module Map': {
          url: platformUrl('winsdk.modulemap'),
          destination: path.join(sdkShare, 'winsdk.modulemap')
        },
        'WinSDK(UM) Module Map': {
          url: platformUrl('um.modulemap'),
          destination: path.join(sdkShare, 'um.modulemap')
        },
        'WinSDK(Shared) Module Map': {
          url: platformUrl('shared.modulemap'),
          destination: path.join(sdkShare, 'shared.modulemap')
        },
        'WinSDK(WinRT) Module Map': {
          url: platformUrl('winrt.modulemap'),
          destination: path.join(sdkShare, 'winrt.modulemap')
        },
        'WinSDK(WinRT) Shim Header': {
          url: platformUrl('SwiftWinRT.h'),
          destination: path.join(sdkShare, 'SwiftWinRT.h')
        }
      }
    : {
        '(Legacy) WinSDK Module Map': {
          url: platformUrl('winsdk_um.modulemap'),
          destination: path.join(sdkShare, 'winsdk.modulemap')
        },
        'WinSDK(UM) Module Map': {
          url: platformUrl('winsdk_um.modulemap'),
          destination: path.join(sdkShare, 'winsdk_um.modulemap')
        },
        'WinSDK(Shared) Module Map': {
          url: platformUrl('winsdk_shared.modulemap'),
          destination: path.join(sdkShare, 'winsdk_shared.modulemap')
        }
      }

  const moduleDefinitions: ModuleDefinitions = {
    ...winsdkModuleDefinitions,
    'UCRT Module Map': {
      url: platformUrl('ucrt.modulemap'),
      destination: path.join(sdkShare, 'ucrt.modulemap')
    },
    'VCRuntime Module Map': {
      url: platformUrl('vcruntime.modulemap'),
      destination: path.join(sdkShare, 'vcruntime.modulemap')
    },
    'VCRuntime API Notes': {
      url: platformUrl('vcruntime.apinotes'),
      destination: path.join(sdkShare, 'vcruntime.apinotes')
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

  const createdDirectories: string[] = []
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
                core.debug(`Received ${name} module definition: "${rawData}"`)
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
