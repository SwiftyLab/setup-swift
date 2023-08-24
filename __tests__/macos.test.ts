import {ToolchainVersion} from '../src/version'
import {XcodePlatform} from '../src/platform'

describe('macOS release metadata fetch verification', () => {
  it('detects last item', async () => {
    const platform = new XcodePlatform('x64')
    const version = ToolchainVersion.create('latest', false)
    const tools = await platform.tools(version)

    const earliestTool = tools[tools.length - 1]
    expect(earliestTool.xcode).toBe('7.3')
    expect(earliestTool.dir).toBe('swift-2.2-RELEASE')
    expect(earliestTool.platform).toBe('xcode')
    expect(earliestTool.branch).toBe('swift-2.2-release')
    expect(earliestTool.download).toBe('swift-2.2-RELEASE-osx.pkg')
    expect(earliestTool.symbols).toBeUndefined()

    const earliestDownloadableTool = tools
      .slice()
      .reverse()
      .find(tool => tool.symbols)
    expect(earliestDownloadableTool?.xcode).toBe('8')
    expect(earliestDownloadableTool?.dir).toBe('swift-3.0-RELEASE')
    expect(earliestDownloadableTool?.download).toBe('swift-3.0-RELEASE-osx.pkg')
    expect(earliestDownloadableTool?.symbols).toBe(
      'swift-3.0-RELEASE-osx-symbols.pkg'
    )
    expect(earliestDownloadableTool?.platform).toBe('xcode')
    expect(earliestDownloadableTool?.branch).toBe('swift-3.0-release')
  })
})
