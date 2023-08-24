import {Os} from 'getos'

let system: Os

export function __setos(newos: Os) {
  system = newos
}

export default function getos(
  cb: (error: Error | null, os: Os) => void
): string {
  cb(null, system)
  return system.os
}
