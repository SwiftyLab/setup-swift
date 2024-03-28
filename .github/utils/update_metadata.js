'use strict'
const path = require('path');
const fs = require('fs').promises;
const core = require('@actions/core');
const {exec,getExecOutput} = require('@actions/exec');
const yaml = require('js-yaml');
const semver = require('semver');
const https = require('https');

const SWIFT_ORG = 'swiftorg';
const SWIFT_ORG_BUILD = path.join(SWIFT_ORG, '_data', 'builds');
const SWIFT_ORG_CWD = {cwd: SWIFT_ORG};

async function swiftorgCommit() {
  const {stdout} = await getExecOutput('git', ['rev-parse', '--verify', 'HEAD'], SWIFT_ORG_CWD);
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
  const devBranchRegex = /swift-([^-]*)-branch/;
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

exports.update = async () => {
  const commit = await swiftorgCommit();
  const release = await latestRelease();
  const dev = await latestDevRelease();
  const snapshot = await latestSnapshot();

  const swiftorg = { commit: commit, release: release, dev: dev, snapshot: snapshot };
  const data = JSON.stringify(swiftorg);
  core.info(`Updating swiftorg metadata to "${data}"`);
  const metadata = path.join('pages', 'metadata.json');
  await fs.mkdir(path.dirname(metadata), {recursive: true});
  await fs.writeFile(metadata, data, 'utf-8');
  return data;
};

exports.currentData = async () => {
  return new Promise((resolve, reject) => {
    https.get(
      'https://swiftylab.github.io/setup-swift/metadata.json',
      res => {
        const {statusCode} = res
        const contentType = res.headers['content-type']

        let error
        if (statusCode !== 200) {
          error = new Error(`Request Failed Status Code: '${statusCode}'`)
        } else if (!contentType?.startsWith('application/json')) {
          error = new Error(`Invalid content-type: ${contentType}`)
        }

        if (error) {
          core.error(error.message)
          res.resume()
          reject(error)
          return
        }

        let rawData = ''
        res.setEncoding('utf8')
        res.on('data', chunk => {
          rawData += chunk
        })
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData)
            core.debug(`Recieved swift.org metadata: "${rawData}"`)
            resolve(parsedData)
          } catch (e) {
            core.error(`Parsing swift.org metadata error: '${e}'`)
            reject(e)
          }
        })
      }
    )
  })
}

exports.fetch = async () => {
  let checkoutData;
  if (process.env.SETUPSWIFT_SWIFTORG_METADATA) {
    checkoutData = JSON.parse(process.env.SETUPSWIFT_SWIFTORG_METADATA);
  } 
  if (!checkoutData || !checkoutData.commit) {
    checkoutData = await this.currentData();
  }
  const origin = 'https://github.com/apple/swift-org-website.git'
  const ref = checkoutData.commit
  await exec('git', ['init', SWIFT_ORG])
  await exec('git', ['fetch', origin, ref, '--depth=1', '--no-tags'], SWIFT_ORG_CWD)
  await exec('git', ['checkout', 'FETCH_HEAD', '--detach'], SWIFT_ORG_CWD)
}
