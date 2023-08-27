import * as exec from '@actions/exec'
import {PackageManager} from '../../src/installer/package_manager'

describe('package manager setup validation', () => {
  it('tests package manager running correct commands', async () => {
    const execSpy = jest.spyOn(exec, 'exec')
    execSpy.mockResolvedValue(0)
    const installationCommands = ['apt-get', 'install', 'pkg1', 'pkg2']
    const manager = new PackageManager(installationCommands)
    expect(manager.name).toBe('apt-get')
    expect(manager.installationCommands).toBe(installationCommands)
    await manager.install()
    await expect(execSpy).toHaveBeenCalledTimes(2)
    const calls = execSpy.mock.calls
    expect(calls[0]).toStrictEqual(['sudo', ['apt-get', 'update']])
    expect(calls[1]).toStrictEqual(['sudo', [...installationCommands, '-y']])
  })
})
