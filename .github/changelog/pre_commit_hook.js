'use strict'
const core = require('@actions/core');
const {exec} = require('@actions/exec');

exports.preCommit = async (props) => {
  core.startGroup(`Bundling`);
  await exec('npm install --legacy-peer-deps');
  await exec('npm run package');
  core.endGroup();
};
