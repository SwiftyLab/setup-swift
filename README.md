# Setup Swift

[![GitHub Action](https://img.shields.io/github/v/tag/SwiftyLab/setup-swift?logo=github&label=GitHub)](https://github.com/marketplace/actions/setup-swift-environment-for-macos-linux-and-windows)
[![Supports macOS, Linux & Windows](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?label=platform)](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners#supported-runners-and-hardware-resources)
[![CI/CD](https://github.com/SwiftyLab/setup-swift/actions/workflows/main.yml/badge.svg)](https://github.com/SwiftyLab/setup-swift/actions/workflows/main.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/swiftylab/setup-swift/badge)](https://www.codefactor.io/repository/github/swiftylab/setup-swift)
[![codecov](https://codecov.io/gh/SwiftyLab/setup-swift/graph/badge.svg?token=XWfSpWQ6gC)](https://codecov.io/gh/SwiftyLab/setup-swift)
[![Get it from Marketplace](https://img.shields.io/badge/Get_it-from_Marketplace-blue?logo=github)](https://github.com/marketplace/actions/setup-swift-environment-for-macos-linux-and-windows)

[GitHub Action](https://github.com/features/actions) that will setup [Swift](https://swift.org) environment with specified version.
This action supports the following functionalities:

- Works on Linux, macOS and Windows(Swift 5.10 and after not supported on Windows).
- Supports [installing latest major/minor/patch](#specifying-version).
- Provides snapshots as soon as published in `swift.org`.
- Verifies toolchain snapshots before installation (`gpg` for Linux and Windows, `pkgutil` for macOS) .
- Allows development snapshots by enabling `development` flag and optional version.
- Prefers existing Xcode installations.
- Caches installed setup in tool cache.
- Allows fetching snapshot metadata without installation (can be used to setup docker images).

| Release Type | Latest Available |
|--------------|------------------|
| Stable | [![Latest Release](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FSwiftyLab%2Fsetup-swift%2Fmain%2Fpackage.json&query=%24.swiftorg.release.name&logo=swift&logoColor=white&label=Swift&color=orange)](https://www.swift.org/download/#releases)<br/>[![Latest Release Tag](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FSwiftyLab%2Fsetup-swift%2Fmain%2Fpackage.json&query=%24.swiftorg.release.tag&logo=swift&logoColor=white&label=tag&color=orange)](https://www.swift.org/download/#releases) |
| Development | [![Latest Development Snapshot](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FSwiftyLab%2Fsetup-swift%2Fmain%2Fpackage.json&query=%24.swiftorg.dev.name&logo=swift&logoColor=white&label=Swift&color=orange)](https://www.swift.org/download/#snapshots)<br/>[![Latest Development Snapshot Tag](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FSwiftyLab%2Fsetup-swift%2Fmain%2Fpackage.json&query=%24.swiftorg.dev.tag&logo=swift&logoColor=white&label=tag&color=orange)](https://www.swift.org/download/#snapshots)<br/>[![Latest Development Snapshot Date](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FSwiftyLab%2Fsetup-swift%2Fmain%2Fpackage.json&query=%24.swiftorg.dev.date&logo=swift&logoColor=white&label=date)](https://www.swift.org/download/#snapshots) |
| Trunk Development | [![Latest Trunk Development Snapshot Tag](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FSwiftyLab%2Fsetup-swift%2Fmain%2Fpackage.json&query=%24.swiftorg.snapshot.tag&logo=swift&logoColor=white&label=tag&color=orange)](https://www.swift.org/download/#snapshots)<br/>[![Latest Trunk Development Snapshot Date](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FSwiftyLab%2Fsetup-swift%2Fmain%2Fpackage.json&query=%24.swiftorg.snapshot.date&logo=swift&logoColor=white&label=date)](https://www.swift.org/download/#snapshots) |

## Usage

To run the action with the latest stable release swift version available, simply add the action as a step in your workflow:

```yml
- uses: SwiftyLab/setup-swift@latest
```

Or use the latest development snapshots by enabling the `development` flag:

```yml
- uses: SwiftyLab/setup-swift@latest
  with:
    development: true
```

After the environment is configured you can run swift and xcode commands using the standard [`run`](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#jobsjob_idstepsrun) step:

```yml
- uses: SwiftyLab/setup-swift@latest
- name: Get swift version
  run: swift --version
- name: Get swift version in macOS
  if: runner.os == 'macOS'
  run: xcrun --toolchain ${{ env.TOOLCHAINS }} swift --version
```

A specific Swift version can be set using the `swift-version` input, [see the format](#specifying-version):

```yml
- uses: SwiftyLab/setup-swift@latest
  with:
    swift-version: "5.1.0"
- name: Get swift version
  run: swift --version # Swift 5.1.0
- name: Get swift version in macOS
  if: runner.os == 'macOS'
  run: xcrun --toolchain ${{ env.TOOLCHAINS }} swift --version # Swift 5.1.0
```

Works perfect together with job matrixes:

```yml
name: Swift ${{ matrix.swift }} on ${{ matrix.os }}
runs-on: ${{ matrix.os }}
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    swift: ["5.4.3", "5.2.4"]
steps:
- uses: SwiftyLab/setup-swift@latest
  with:
    swift-version: ${{ matrix.swift }}
- name: Get swift version
  run: swift --version
```

**See [action.yml](action.yml) for complete list of inputs and outputs.**

## Specifying version

This project uses strict semantic versioning to determine what version of Swift to configure. This differs slightly from the official convention used by Swift.

For example, Swift is available as version `5.1` but using this as value for `swift-version` will be interpreted as a version _range_ of `5.1.X` where `X` is the latest patch version available for that major and minor version.

In other words specifying...

- `"5.1"` will resolve to latest patch version (aka `5.1.5`)
- `"5.1.0"` will resolve to version `5.1`
- `"4"` will resolve to latest minor and patch version (aka `4.2.4`)
- `"4.0.0"` will resolve to version `4.0`

### Caveats

YAML interprets eg. `4.0` as a float, this action will then interpret that as `4` which will result in eg. Swift `4.2.4` being resolved. Quote your inputs! Thus surround version input with quotations:

```yml
- uses: SwiftyLab/setup-swift@v1
  with:
    swift-version: '5.0'
```

Not:

```yml
- uses: SwiftyLab/setup-swift@v1
  with:
    swift-version: 5.0
```

## Keeping the action up-to-date

You have two options for keeping this action up-to-date: either use the `latest` tag to always have the latest changes or define a specific version (like `v1.0.0`).

**Note: This action uses [dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates) to keep [swift.org](https://github.com/apple/swift-org-website) submodule data up-to-date. Due to the frequency of snapshots published, the changes aren't merged immediately rather kept as a separate PR. If you need action to be updated, comment `@swiftylab-ci anything..` on the PR to merge and update this action.**

### Latest version tag (Recommended)

You can use the `latest` tag to always have the latest changes. This action is updated automatically as soon as new toolchain snapshots are published in [swift.org](https://github.com/apple/swift-org-website), by using the `latest` tag you have access to these data automagically.

### Specific version

You can the specific version tag together with [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates) to keep the action up-to-date. You will automatically get notifed when the action updates and you can read the changelog directly in the PR opened by dependabot.

## License

`setup-swift` is released under the MIT license. [See LICENSE](LICENSE) for details.
The Swift logo is a trademark of Apple Inc.
