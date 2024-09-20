'use strict'
import semver from 'semver';
import core from '@actions/core';

exports.preVersionGeneration = (version) => {
  const {VERSION} = process.env;
  core.info(`Computed version bump: ${version}`);

  const newVersion = semver.valid(VERSION);
  if (newVersion) {
    version = newVersion;
    core.info(`Using provided version: ${version}`);
  }
  return version;
};

exports.preTagGeneration = (tag) => {};
