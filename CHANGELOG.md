## [1.4.0](https://github.com/SwiftyLab/setup-swift/compare/v1.3.0...v1.4.0) (2023-09-19)


### 🚀 Features

* added optional visual studio components option ([a01e266](https://github.com/SwiftyLab/setup-swift/commit/a01e2668943c8d99a331cb52d44876c6336ee318))
* allowed passing snapshot name as version ([#49](https://github.com/SwiftyLab/setup-swift/issues/49)) ([dff1353](https://github.com/SwiftyLab/setup-swift/commit/dff1353e6e467b072b59c3218acb24b16769f183))


### 🐛 Fixes

* fixed setup on windows when tool cached ([#44](https://github.com/SwiftyLab/setup-swift/issues/44)) ([68f6906](https://github.com/SwiftyLab/setup-swift/commit/68f6906509f26a5ee1496bdfb212fad36667809e))


### 🐎 Performance Improvements

* installation will be saved in cache ([#48](https://github.com/SwiftyLab/setup-swift/issues/48)) ([5bd49ae](https://github.com/SwiftyLab/setup-swift/commit/5bd49ae7d03cc148e94e2c73e4ef6e7e659ef8eb))
* skip visual studio components installation if not needed ([32576cd](https://github.com/SwiftyLab/setup-swift/commit/32576cd24d02f2bb553d109a3a8d5d6ab997cbbc))


### 🛠 Build System

* **swift-org-website:** bump swiftorg from `e851408` to `73f218c` ([#61](https://github.com/SwiftyLab/setup-swift/issues/61)) ([1be0f90](https://github.com/SwiftyLab/setup-swift/commit/1be0f90e4647da135dea357a48307f9af6c9bc8f))


### 🛠 Dependency

* removed `jsdom` and `marked` ([#56](https://github.com/SwiftyLab/setup-swift/issues/56)) ([4ec14b4](https://github.com/SwiftyLab/setup-swift/commit/4ec14b4b1da900dc8d1d428b94d355e36307327a))


### 🔥 Refactorings

* update `swift-org-website` released tools parsing ([#54](https://github.com/SwiftyLab/setup-swift/issues/54)) ([59a0afe](https://github.com/SwiftyLab/setup-swift/commit/59a0afed1b1867329d2218499c26f3ecd84dc108))


### 💄 Styles

* added codespace container customization ([#50](https://github.com/SwiftyLab/setup-swift/issues/50)) ([22bf437](https://github.com/SwiftyLab/setup-swift/commit/22bf4373f029cc63d06ffdf2f995b1129ea7458c))

## [1.3.0](https://github.com/SwiftyLab/setup-swift/compare/v1.2.0...v1.3.0) (2023-09-05)


### 🚀 Features

* added downloaded snapshots caching ([#27](https://github.com/SwiftyLab/setup-swift/issues/27)) ([8b96634](https://github.com/SwiftyLab/setup-swift/commit/8b96634bde6d708c06e8af8e1e3ac558260b3ce5))
* added snapshots cache control option ([#40](https://github.com/SwiftyLab/setup-swift/issues/40)) ([b025441](https://github.com/SwiftyLab/setup-swift/commit/b02544153f15f77fed1ebe19979c81969bf4f632))


### 🐛 Fixes

* fixed swift package build failure on windows ([#23](https://github.com/SwiftyLab/setup-swift/issues/23)) ([80ba175](https://github.com/SwiftyLab/setup-swift/commit/80ba175b327d2ccb52166a29a56baed87b30cf2c))


### 🛠 Build System

* **swift-org-website:** bump swiftorg from `1f5f38a` to `1f57d0e` ([#42](https://github.com/SwiftyLab/setup-swift/issues/42)) ([51b8371](https://github.com/SwiftyLab/setup-swift/commit/51b8371af56d71c10863bf2075a85a6ebb162582))


### 🛠 Dependency

* bump glob from 10.3.3 to 10.3.4 ([#25](https://github.com/SwiftyLab/setup-swift/issues/25)) ([fe5b767](https://github.com/SwiftyLab/setup-swift/commit/fe5b7672d872fe0ecab480153600d5846d784129))

## [1.2.0](https://github.com/SwiftyLab/setup-swift/compare/v1.1.0...v1.2.0) (2023-08-31)


### 🚀 Features

* added option to only fetch toolchain metadata without installation ([#5](https://github.com/SwiftyLab/setup-swift/issues/5)) ([636007f](https://github.com/SwiftyLab/setup-swift/commit/636007f1b3a822ef68b3e20d938a07e60d063ad7))


### 🐛 Fixes

* fixed latest toolchain(> 5.6) setup failure on Windows ([#3](https://github.com/SwiftyLab/setup-swift/issues/3)) ([da27e5b](https://github.com/SwiftyLab/setup-swift/commit/da27e5b1bc2260684b4fccb92e47c000a52a5c3b))


### 🐎 Performance Improvements

* improved for macos with pre-installed xcode ([#8](https://github.com/SwiftyLab/setup-swift/issues/8)) ([d4f4aa5](https://github.com/SwiftyLab/setup-swift/commit/d4f4aa5c181af9cf4e884e3ab702348f7bd43e9a))


### 🛠 Build System

* **swift-org-website:** bump swiftorg from `860d64c` to `1f5f38a` ([#18](https://github.com/SwiftyLab/setup-swift/issues/18)) ([80fdfa0](https://github.com/SwiftyLab/setup-swift/commit/80fdfa018d9b716e9cf50d7c867d4996376eee5d))


### 🛠 Dependency

* bump marked from 7.0.4 to 7.0.5 ([#12](https://github.com/SwiftyLab/setup-swift/issues/12)) ([3e548d0](https://github.com/SwiftyLab/setup-swift/commit/3e548d0524c389a47b5573332d397190286bd8f8))


### 📚 Documentation

* **README:** added auto `swift.org` sync details ([#22](https://github.com/SwiftyLab/setup-swift/issues/22)) ([e3278d6](https://github.com/SwiftyLab/setup-swift/commit/e3278d6a831d9135ed60a1570eb8ffd6e941a985))


### ✅ Tests

* added more unit and integration tests ([#6](https://github.com/SwiftyLab/setup-swift/issues/6)) ([8aa70d7](https://github.com/SwiftyLab/setup-swift/commit/8aa70d70fbbb2790fbaa9cd10b71b54714f2ec04))

## [1.1.0](https://github.com/SwiftyLab/setup-swift/compare/v1.0.0...v1.1.0) (2023-08-26)


### 🚀 Features

* added support for multiple Linux distros ([#4](https://github.com/SwiftyLab/setup-swift/issues/4)) ([8b4a245](https://github.com/SwiftyLab/setup-swift/commit/8b4a245e6ba0edd38dd846f4fee109cf496a0cb2))

## [1.0.0](https://github.com/SwiftyLab/setup-swift/compare/1ca86a3c0219ba719eced849abe324b0afccaf50...v1.0.0) (2023-08-24)


### 🚀 Features

* added setting up swift environment ([1ca86a3](https://github.com/SwiftyLab/setup-swift/commit/1ca86a3c0219ba719eced849abe324b0afccaf50))

