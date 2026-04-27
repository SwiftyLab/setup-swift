'use strict'
const semver = require('semver')

exports.preVersionGeneration = version => {
  const {VERSION} = process.env
  console.log(`Computed version bump: ${version}`)

  const newVersion = semver.valid(VERSION)
  if (newVersion) {
    version = newVersion
    console.log(`Using provided version: ${version}`)
  }
  return version
}

exports.preTagGeneration = _tag => {}
