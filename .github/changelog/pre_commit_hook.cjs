'use strict'
const {exec} = require('child_process');
const {promisify} = require('util');

const execAsync = promisify(exec);

exports.preCommit = async (props) => {
  console.log('Bundling');
  await execAsync('npm install --legacy-peer-deps');
  await execAsync('npm run package');
};
