## [1.12.0](https://github.com/SwiftyLab/setup-swift/compare/v1.11.0...v1.12.0) (2025-09-17)


### 🚀 Features

* added support for installing SDKs with `sdks` input parameter ([#415](https://github.com/SwiftyLab/setup-swift/issues/415)) ([b67b1fb](https://github.com/SwiftyLab/setup-swift/commit/b67b1fb72258e8570737b42f37bd33ebd7b21f5e))


### 🐛 Fixes

* used installed Windows SDKs instead of hardcoded version ([#417](https://github.com/SwiftyLab/setup-swift/issues/417)) ([376f89c](https://github.com/SwiftyLab/setup-swift/commit/376f89cd5a71db507594ce1223b099d53c233c6f))

## [1.11.0](https://github.com/SwiftyLab/setup-swift/compare/v1.10.0...v1.11.0) (2025-05-24)


### 🚀 Features

* added Windows ARM64 runner support ([#385](https://github.com/SwiftyLab/setup-swift/issues/385)) ([a3015e0](https://github.com/SwiftyLab/setup-swift/commit/a3015e0f55b941df2ecaa28d645ca65c2c1c6816))


### 🐎 Performance Improvements

* improved gpg verification for new windows toolchains ([edebf76](https://github.com/SwiftyLab/setup-swift/commit/edebf7684af159825eb39b203d519468a74e7332))


### 🔥 Refactorings

* updated Visual Studio setup process for required components installation ([9f87bba](https://github.com/SwiftyLab/setup-swift/commit/9f87bba99fb20035b2229259fd76586128844afb))

## [1.10.0](https://github.com/SwiftyLab/setup-swift/compare/v1.9.1...v1.10.0) (2025-03-16)


### 🚀 Features

* added open source toolchain preference option for xcode ([#371](https://github.com/SwiftyLab/setup-swift/issues/371)) ([82838c4](https://github.com/SwiftyLab/setup-swift/commit/82838c4ebecbd5b8f82d98e961b12f47a40b5d82))
* allow Windows SDK version to be picked up from custom visual studio components ([#372](https://github.com/SwiftyLab/setup-swift/issues/372)) ([d259fc2](https://github.com/SwiftyLab/setup-swift/commit/d259fc2d831e052a607fe0cde0904794b00d985f))


### 🐛 Fixes

* remove unnecessary steps for windows ([#370](https://github.com/SwiftyLab/setup-swift/issues/370)) ([382df93](https://github.com/SwiftyLab/setup-swift/commit/382df93eb034bf078e442ec1b88c9cae16faa16b))

## [1.9.1](https://github.com/SwiftyLab/setup-swift/compare/v1.9.0...v1.9.1) (2024-12-27)


### 🛠 Build System

* added support for latest swiftorg metadata ([#343](https://github.com/SwiftyLab/setup-swift/issues/343)) ([b876af6](https://github.com/SwiftyLab/setup-swift/commit/b876af6e7ce58194afcab2f3b49a1268154a3797))

## [1.9.0](https://github.com/SwiftyLab/setup-swift/compare/v1.8.0...v1.9.0) (2024-11-08)


### 🚀 Features

* support Windows 11 SDK ([#334](https://github.com/SwiftyLab/setup-swift/issues/334)) ([6efadfd](https://github.com/SwiftyLab/setup-swift/commit/6efadfd7c6311dad57e3c73a497df30622e003e4))


### 🐛 Fixes

* removed tool caching if tool cache is already present ([#332](https://github.com/SwiftyLab/setup-swift/issues/332)) ([51f8149](https://github.com/SwiftyLab/setup-swift/commit/51f8149db313536e87bfa8618df91ffe95395876))

## [1.8.0](https://github.com/SwiftyLab/setup-swift/compare/v1.7.0...v1.8.0) (2024-09-20)


### 🚀 Features

* expand `SWIFTFLAGS` with full paths ensure CMD and PowerShell compatibility ([#74](https://github.com/SwiftyLab/setup-swift/issues/74)) ([8573d06](https://github.com/SwiftyLab/setup-swift/commit/8573d0697a49e239a7e50df61f1555597a12e64e))


### 🐛 Fixes

* fixed macOS action cache architecture mismatch ([#317](https://github.com/SwiftyLab/setup-swift/issues/317)) ([8822077](https://github.com/SwiftyLab/setup-swift/commit/8822077d38869be2e4c57dce79d18515621e5498))
* fixed older Swift toolchain installations on Windows ([#307](https://github.com/SwiftyLab/setup-swift/issues/307)) ([420581b](https://github.com/SwiftyLab/setup-swift/commit/420581bc75610ae2a394df7f2a6f457200a2c715))
* fixed Visual Studio setup with fallback windows installation ([#314](https://github.com/SwiftyLab/setup-swift/issues/314)) ([f2a737f](https://github.com/SwiftyLab/setup-swift/commit/f2a737f69b00c97c2704514174842e5577914597))

## [1.7.0](https://github.com/SwiftyLab/setup-swift/compare/v1.6.0...v1.7.0) (2024-04-19)


### 🚀 Features

* added custom toolchains support ([#273](https://github.com/SwiftyLab/setup-swift/issues/273)) ([dc93ecd](https://github.com/SwiftyLab/setup-swift/commit/dc93ecd7be099ce0f3b0487188cb995b025948b1))
* added fallback windows installation without caching support ([#276](https://github.com/SwiftyLab/setup-swift/issues/276)) ([7030849](https://github.com/SwiftyLab/setup-swift/commit/7030849a1ca58b88175468ecd8b4c0b82bd1917f))


### 📚 Documentation

* added conduct and contributing guidelines ([#268](https://github.com/SwiftyLab/setup-swift/issues/268)) ([9409a11](https://github.com/SwiftyLab/setup-swift/commit/9409a1123f019286138345d02af08e7698a2b171))
* added issue templates ([#267](https://github.com/SwiftyLab/setup-swift/issues/267)) ([b9e53af](https://github.com/SwiftyLab/setup-swift/commit/b9e53af632679d244c184dc63dd89e99aa03d781))

## [1.6.0](https://github.com/SwiftyLab/setup-swift/compare/v1.5.2...v1.6.0) (2024-03-29)


### 🚀 Features

* added git ref support to `check-latest` option ([840a162](https://github.com/SwiftyLab/setup-swift/commit/840a162aceb6bbd06e4d75fc2a01368606fbcd79))
* added supporting new swift toolchains without action release ([#259](https://github.com/SwiftyLab/setup-swift/issues/259)) ([b8b0c2a](https://github.com/SwiftyLab/setup-swift/commit/b8b0c2a092dae00291896efaed137186604e8a4f))


### 🐛 Fixes

* fixed toolchain caching ([a36cd73](https://github.com/SwiftyLab/setup-swift/commit/a36cd7340bd78afaec08414baf006875c510cfc8))


### 🐎 Performance Improvements

* added skipping gpg verification if signature missing ([17c7929](https://github.com/SwiftyLab/setup-swift/commit/17c79292c8f4fa745c8473d6e3d1b1ee36ee6d6e))
* cache will only be saved if not saved once ([a7ba193](https://github.com/SwiftyLab/setup-swift/commit/a7ba1938c28b6866f405452b04d443f3f9bab9b1))


### 🛠 Dependency

* bump glob from 10.3.10 to 10.3.12 ([#261](https://github.com/SwiftyLab/setup-swift/issues/261)) ([3495928](https://github.com/SwiftyLab/setup-swift/commit/349592802c9eab68a74c07a825d431adb37d185e))

## [1.5.2](https://github.com/SwiftyLab/setup-swift/compare/v1.5.1...v1.5.2) (2024-03-23)


### 🛠 Build System

* pause windows support for Swift 5.10 and above temporarily ([#250](https://github.com/SwiftyLab/setup-swift/issues/250)) ([186489b](https://github.com/SwiftyLab/setup-swift/commit/186489b82cce737a52b9d7a94856cf7085b235ca))
* **swift-org-website:** bump swiftorg from `cd5a1a3` to `74caef9` ([#253](https://github.com/SwiftyLab/setup-swift/issues/253)) ([0913e1d](https://github.com/SwiftyLab/setup-swift/commit/0913e1d949c815a2c486b09218328e836e98e958))


### 🛠 Dependency

* bump @actions/cache from 3.2.2 to 3.2.4 ([#225](https://github.com/SwiftyLab/setup-swift/issues/225)) ([a75eb22](https://github.com/SwiftyLab/setup-swift/commit/a75eb22109114133bd2a724be26d24367a33dce3))

## [1.5.1](https://github.com/SwiftyLab/setup-swift/compare/v1.5.0...v1.5.1) (2023-12-15)


### 🛠 Build System

* **swift-org-website:** bump swiftorg from `8485bd3` to `9ce4db8` ([#124](https://github.com/SwiftyLab/setup-swift/issues/124)) ([e0fff81](https://github.com/SwiftyLab/setup-swift/commit/e0fff8108a7160e0a285638edb820431b466a78c))
* **swift-org-website:** bump swiftorg from `9ce4db8` to `cd5a1a3` ([#164](https://github.com/SwiftyLab/setup-swift/issues/164)) ([8484fad](https://github.com/SwiftyLab/setup-swift/commit/8484fadc36ea71c1f3584fdcc32bba048c400b59))


### 🛠 Dependency

* bump glob from 10.3.4 to 10.3.10 ([#154](https://github.com/SwiftyLab/setup-swift/issues/154)) ([44ecbc4](https://github.com/SwiftyLab/setup-swift/commit/44ecbc4e48c1ace6cb1c3b0139842bab722a522b))

## [1.5.0](https://github.com/SwiftyLab/setup-swift/compare/v1.4.1...v1.5.0) (2023-10-25)


### 🚀 Features

* added major version tag option for latest release ([#109](https://github.com/SwiftyLab/setup-swift/issues/109)) ([8967619](https://github.com/SwiftyLab/setup-swift/commit/896761999d9c224950cda4a2ce09dafcd85c6398))


### 🐛 Fixes

* only add existing directories to PATH on windows (by [@stevapple](https://github.com/stevapple)) ([#71](https://github.com/SwiftyLab/setup-swift/issues/71)) ([5dfc518](https://github.com/SwiftyLab/setup-swift/commit/5dfc5184796ead5ef4e3ce6bae9ba37ea8049151))
* removed deprecated recursive `fs.rmdir` (by [@stevapple](https://github.com/stevapple)) ([#70](https://github.com/SwiftyLab/setup-swift/issues/70)) ([214f7e8](https://github.com/SwiftyLab/setup-swift/commit/214f7e8b9f3ca70f27d94c87df8bd5f391f4e7df))
* specified initial branch name to suppress Git hint (by [@stevapple](https://github.com/stevapple)) ([#69](https://github.com/SwiftyLab/setup-swift/issues/69)) ([b6ac81d](https://github.com/SwiftyLab/setup-swift/commit/b6ac81d2f164dfd6284810ea9d96153396c88102))


### 🛠 Build System

* **swift-org-website:** bump swiftorg from `332574c` to `8485bd3` ([#121](https://github.com/SwiftyLab/setup-swift/issues/121)) ([3dc4e02](https://github.com/SwiftyLab/setup-swift/commit/3dc4e02d472756dc0274f4382e5d623a0e550129))


### 🛠 Dependency

* bump @actions/core from 1.10.0 to 1.10.1 ([#83](https://github.com/SwiftyLab/setup-swift/issues/83)) ([4928498](https://github.com/SwiftyLab/setup-swift/commit/4928498ae8966f566b41948a132fe7e32dd99478))
* bump @babel/traverse and depcheck ([#105](https://github.com/SwiftyLab/setup-swift/issues/105)) ([6bf5161](https://github.com/SwiftyLab/setup-swift/commit/6bf5161f02794ca34b978c043d540d1be4780cd0))

## [1.4.1](https://github.com/SwiftyLab/setup-swift/compare/v1.4.0...v1.4.1) (2023-09-25)


### 🐛 Fixes

* fixed snapshots not sorted by semantic version ([#65](https://github.com/SwiftyLab/setup-swift/issues/65)) ([e8192a4](https://github.com/SwiftyLab/setup-swift/commit/e8192a4bdccd10dbf9bb594fb60916e75c622355))


### 🛠 Build System

* **swift-org-website:** bump swiftorg from `73f218c` to `332574c` ([#67](https://github.com/SwiftyLab/setup-swift/issues/67)) ([0a57e00](https://github.com/SwiftyLab/setup-swift/commit/0a57e00e64135816707f7ae393b6cdf9b0c982bc))
* updated action ruuner to Node v20 ([#66](https://github.com/SwiftyLab/setup-swift/issues/66)) ([c09b206](https://github.com/SwiftyLab/setup-swift/commit/c09b2063946c55be8a759e5a7caf3db01a1c7d3a))

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

