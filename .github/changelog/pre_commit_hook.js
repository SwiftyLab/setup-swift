'use strict'
import core from '@actions/core';
import {exec} from '@actions/exec';

exports.preCommit = async (props) => {
  core.startGroup(`Bundling`);
  await exec('npm install --legacy-peer-deps');
  await exec('npm run package');
  core.endGroup();
};
