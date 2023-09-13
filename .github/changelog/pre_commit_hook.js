'use strict'
const path = require('path');
const fs = require('fs').promises;
const core = require('@actions/core');
const {exec, getExecOutput} = require('@actions/exec');
const yaml = require('js-yaml');
const semver = require('semver');
const PackageJson = require('@npmcli/package-json');

const SWIFT_ORG_BUILD = path.join('swiftorg', '_data', 'builds');

async function swiftorgCommit() {
  const gitOptions = {cwd: 'swiftorg'};
  const {stdout} = await getExecOutput('git', ['rev-parse', '--verify', 'HEAD'], gitOptions);
  return stdout.trim();
}

async function latestRelease() {
  const swiftRelease = path.join(SWIFT_ORG_BUILD, 'swift_releases.yml');
  const releaseData = await fs.readFile(swiftRelease, 'utf-8');
  const releases = yaml.load(releaseData);
  return releases[releases.length - 1];
}

async function latestDevRelease() {
  const buildEntries = await fs.readdir(SWIFT_ORG_BUILD, { withFileTypes: true });
  const devBranchRegex = /swift-(.*)-branch/;
  const devDirs = buildEntries.flatMap(entry => {
      if (!entry.isDirectory() || !devBranchRegex.exec(entry.name)) {
          return [];
      }
      return entry.name;
  }).sort((dir1, dir2) => {
      const ver1 = devBranchRegex.exec(dir1)[1].replace('_', '.');
      const ver2 = devBranchRegex.exec(dir2)[1].replace('_', '.');
      return semver.gt(semver.coerce(ver2), semver.coerce(ver1)) ? 1 : -1;
  });
  const devVer = devBranchRegex.exec(devDirs[0])[1].replace('_', '.');
  const xcodeSnapshot = path.join(SWIFT_ORG_BUILD,devDirs[0], 'xcode.yml');
  const devReleaseData = await fs.readFile(xcodeSnapshot, 'utf-8');
  const devReleases = yaml.load(devReleaseData);
  return { name: devVer, date: devReleases[0].date, tag: devReleases[0].dir };
}

async function latestSnapshot() {
  const xcodeSnapshot = path.join(SWIFT_ORG_BUILD, 'development', 'xcode.yml');
  const devSnapshotsData = await fs.readFile(xcodeSnapshot, 'utf-8');
  const snapshots = yaml.load(devSnapshotsData);
  return { date: snapshots[0].date, tag: snapshots[0].dir };
}

exports.preCommit = async (props) => {
  const commit = await swiftorgCommit();
  const release = await latestRelease();
  const dev = await latestDevRelease();
  const snapshot = await latestSnapshot();

  const swiftorg = { commit: commit, release: release, dev: dev, snapshot: snapshot };
  const pkgJson = await PackageJson.load('./');
  core.info(`Updating swiftorg metadata to "${JSON.stringify(swiftorg)}"`);
  pkgJson.update({ swiftorg: swiftorg });
  await pkgJson.save();

  core.startGroup(`Bundling`);
  await exec('npm install');
  await exec('npm run package');
  core.endGroup();
};
