import {
  ToolchainVersion,
  SemanticToolchainVersion,
  LatestToolchainVersion
} from '../src/version'

describe('parse version from provided string', () => {
  it('parses latest version', async () => {
    const version = ToolchainVersion.create('latest', false)
    expect(version).toBeInstanceOf(LatestToolchainVersion)
    expect(version.dev).toBe(false)
  })

  it('parses current version', async () => {
    const version = ToolchainVersion.create('current', false)
    expect(version).toBeInstanceOf(LatestToolchainVersion)
    expect(version.dev).toBe(false)
  })

  it('parses fully non-qualified semver', async () => {
    const version = ToolchainVersion.create('5.5', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    expect((version as SemanticToolchainVersion).requested).toBe('5.5')
  })

  it('parses fully qualified semver', async () => {
    const version = ToolchainVersion.create('5.5.1', false)
    expect(version).toBeInstanceOf(SemanticToolchainVersion)
    expect(version.dev).toBe(false)
    expect((version as SemanticToolchainVersion).requested).toBe('5.5.1')
  })

  it('parses invalid input', async () => {
    const creation = () => ToolchainVersion.create('invalid', false)
    expect(creation).toThrow()
  })
})
