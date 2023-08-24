'use strict'
const core = require('@actions/core');
const {exec, getExecOutput} = require('@actions/exec');

exports.preCommit = async (props) => {
  const gitOptions = {cwd: 'swiftorg'};
  const {stdout} = await getExecOutput('git', ['rev-parse', '--verify', 'HEAD'], gitOptions);
  const swiftorg = stdout.trim();
  core.info(`Updating swiftorg to "${swiftorg}"`);
  await exec('npm', ['pkg', 'set', `swiftorg=${swiftorg}`]);

  core.startGroup(`Bundling`);
  await exec('npm install');
  await exec('npm run package');
  core.endGroup();
};
