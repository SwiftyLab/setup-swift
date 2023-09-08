import {
  ToolchainVersion,
  SemanticToolchainVersion,
  LatestToolchainVersion,
  ToolchainSnapshotName
} from '../src/version'

describe('parse version from provided string', () => {
  it('parses latest version', async () => {
    const version = ToolchainVersion.create('latest', false)
    expect(version).toBeInstanceOf(LatestToolchainVersion)
    expect(version.dev).toBe(false)
    expect(`${version}`).toBe('latest version')

    const devVersion = ToolchainVersion.create('latest', true)
    expect(devVersion).toBeInstanceOf(LatestToolchainVersion)
    expect(devVersion.dev).toBe(true)
    expect(`${devVersion}`).toBe('latest dev version')
  })

  it('parses current version', async () => {
    const version = ToolchainVersion.create('current', false)
    expect(version).toBeInstanceOf(LatestToolchainVersion)
    expect(version.dev).toBe(false)
    expect(`${version}`).toBe('latest version')

    const devVersion = ToolchainVersion.create('current', true)
    expect(devVersion).toBeInstanceOf(LatestToolchainVersion)
    expect(devVersion.dev).toBe(true)
    expect(`${devVersion}`).toBe('latest dev version')
  })

  it('parses X semver', async () => {
    const version = ToolchainVersion.create('5', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    expect(`${version}`).toBe('version: 5.0.0, dev: false')
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5/)
  })

  it('parses X.0 semver', async () => {
    const version = ToolchainVersion.create('5.0', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_0*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5.0/)
  })

  it('parses X.0.0 semver', async () => {
    const version = ToolchainVersion.create('5.0.0', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_0-*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5.0-/)
  })

  it('parses X.X semver', async () => {
    const version = ToolchainVersion.create('5.5', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_5*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5.5/)
  })

  it('parses X.X.0 semver', async () => {
    const version = ToolchainVersion.create('5.5.0', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_5-*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5.5-/)
  })

  it('parses X.X.X semver', async () => {
    const version = ToolchainVersion.create('5.5.1', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    const sVersion = version as SemanticToolchainVersion
    expect(sVersion['dirGlob']).toBe('swift-5_5_1*')
    expect(sVersion['dirRegex']).toStrictEqual(/swift-5.5.1/)
  })

  it('parses toolchain name', async () => {
    const name = 'swift-DEVELOPMENT-SNAPSHOT-2023-09-06-a'
    const version = ToolchainVersion.create(name, false)
    expect(version).toBeInstanceOf(ToolchainSnapshotName)
    expect(version.dev).toBe(true)
    const lVersion = version as ToolchainSnapshotName
    expect(lVersion['dirGlob']).toBe('*')
    expect(lVersion['dirRegex']).toStrictEqual(new RegExp(name))
  })

  it('parses toolchain name without prefix', async () => {
    const input = '5.9-DEVELOPMENT-SNAPSHOT-2023-09-05-a'
    const name = `swift-${input}`
    const version = ToolchainVersion.create(input, false)
    expect(version).toBeInstanceOf(ToolchainSnapshotName)
    expect(version.dev).toBe(true)
    const lVersion = version as ToolchainSnapshotName
    expect(lVersion['dirGlob']).toBe('swift-5_9-*')
    expect(lVersion['dirRegex']).toStrictEqual(new RegExp(name))
  })

  it('parses invalid input', async () => {
    const creation = () => ToolchainVersion.create('invalid', false)
    expect(creation).toThrow()
  })
})
