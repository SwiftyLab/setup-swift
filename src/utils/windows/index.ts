import * as path from 'path'

export function systemDrive() {
  return process.env.SystemDrive ?? 'C:'
}

export function program86() {
  const drive = systemDrive()
  const program86 = 'ProgramFiles(x86)'
  return process.env[program86] ?? path.join(drive, program86)
}
