# Contributing Guidelines

This document contains information and guidelines about contributing to this project.
Please read it before you start participating.

_See also: [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md)_

## Submitting Pull Requests

You can contribute by fixing bugs or adding new features, you can go through out [GitHub issues](https://github.com/SwiftyLab/setup-swift/issues) to start contributing. For larger code changes, we first recommend discussing them in our [GitHub dicussions](https://github.com/SwiftyLab/setup-swift/discussions). When submitting a pull request, please do the followings:

1. Apply standard formatting with `npm run format`, and verify added code with lint rules by `npm run lint`.
1. Add relevant tests and ensure your changes don't break any existing tests (see [Automated Tests](#automated-tests) below).
1. Run `npm run build && npm run package` to generate `dist/index.js` with your changes that will be used as part to E2E tests.
1. Commit changes according to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard.

> [!TIP]
> `npm run all` can be executed to apply formatting, linting, generate `dist/index.js` file and run unit tests.

### Things you will need

 * Linux, Mac OS (preferred), or Windows.
 * Git
 * [nodeJS environment](https://nodejs.org/)

### Automated Tests

GitHub action is already setup to run tests on pull requests targeting `main` branch. However, `npm run build && npm run package` needs to be used to generate `dist/index.js` with your changes and these changes needs to be committed along with other code changes.

## Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

<ol type='a'>
  <li id='cert-a'>
  The contribution was created in whole or in part by me and I have the right to submit it under the open source license indicated in the file; or
  </li>
  <li id='cert-b'>
  The contribution is based upon previous work that, to the best of my knowledge, is covered under an appropriate open source license and I have the right under that license to submit that work with modifications, whether created in whole or in part by me, under the same open source license (unless I am permitted to submit under a different license), as indicated in the file; or
  </li>
  <li id='cert-c'>
  The contribution was provided directly to me by some other person who certified <a href="#cert-a">(a)</a>, <a href="#cert-b">(b)</a> or <a href="#cert-c">(c)</a> and I have not modified it.
  </li>
  <li id='cert-d'>
  I understand and agree that this project and the contribution are public and that a record of the contribution (including all personal information I submit with it, including my sign-off) is maintained indefinitely and may be redistributed consistent with this project or the open source license(s) involved.
  </li>
</ol>
