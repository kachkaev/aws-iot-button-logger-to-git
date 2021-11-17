## v2.0.0 (2021-11-17)

- **[Breaking]** Switch from [`lambda-git`](https://www.npmjs.com/package/lambda-git) to [Git Lambda Layer](https://github.com/lambci/git-lambda-layer).
  The size of the artifact is significantly smaller and it contains no binaries.

- **[Breaking]** Change default `GIT_REPO_BRANCH` from `master` to `main`.

- **[Breaking]** Upgrade recommended Node runtime version from 12 to 14.
  Node 12 should be still supported but Node 10 support is dropped.

- Upgrade all dependencies, including Parcel v1 → v2.
  This resolves a few dev-only dependency vulnerabilities reported by `yarn audit`.

## v1.0.4 (2020-07-18)

- Upgrade dependencies to mitigate security vulnerabilities

## v1.0.3 (2019-12-22)

- Upgrade dependencies to mitigate security vulnerabilities

## v1.0.2 (2019-07-21)

- Upgrade dependencies to mitigate security vulnerabilities (such as [lodash prototype pollution](https://snyk.io/vuln/SNYK-JS-LODASH-450202))

## v1.0.1 (2019-04-02)

- Add `CHANGELOG.md` (also include it into the build)
- Add missing config docs
- Parse unescaped `\n` and `\r` in `EVENT_LINE_FORMAT` as newline symbols
- Use 24 instead of 12 hour format by default

## v1.0.0 (2019-03-31)

Initial release
