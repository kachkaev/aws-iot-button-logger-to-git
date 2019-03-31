# AWS IoT Button logger to git

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Azure Pipelines status](https://img.shields.io/azure-devops/build/kachkaev/github-pipelines/1/master.svg)](https://dev.azure.com/kachkaev/github-pipelines/_build?definitionId=1)
[![Azure Pipelines coverage](https://img.shields.io/azure-devops/coverage/kachkaev/github-pipelines/1/master.svg)](https://dev.azure.com/kachkaev/github-pipelines/_build?definitionId=1)
[![Known vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/kachkaev/aws-iot-button-logger-to-git.svg)](https://snyk.io/test/github/kachkaev/aws-iot-button-logger-to-git?targetFile=package.json)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

> Work in progress

This repository contains a [Lambda function](https://aws.amazon.com/lambda/) that can be triggered by an [AWS IoT Button](https://aws.amazon.com/iotbutton/) to log clicks in a chosen git repository.
Doing so is useful when you want to record arbitrary infrequent events and then analyze them.

Example output (e.g. `clicks.txt` in `https://github.com/example/my-data.git`):

```csv
2019-01-20 11:48:42 +0000 SINGLE
2019-01-31 00:42:41 +0000 DOUBLE
2019-01-31 00:43:02 +0000 LONG
2019-02-15 09:10:24 +0000 SINGLE
```

## Configuration

See [src/config.ts](src/config.ts) for the details on what is available.

## Deployment

### Using a pre-built version from GitHub

```
aws lambda update-function-code --function-name aws-iot-button-logger-to-git --zip-file fileb://TODO.zip
```

### Using your own build

```bash
yarn install
yarn build

aws lambda update-function-code --function-name aws-iot-button-logger-to-git --zip-file fileb://build.zip
```

## Development

### Getting started

1.  Ensure you have the latest git, Node.js and Yarn installed:

    ```bash
    git --version
    ## ≥ 2.14

    node --version
    ## ≥ 8.0

    yarn --version
    ## ≥ 1.10
    ```

1.  Clone the repository:

    ```bash
    cd PATH/TO/MISC/PROJECTS
    git clone https://github.com/kachkaev/aws-iot-button-logger-to-git.git
    cd aws-iot-button-logger-to-git
    ```

1.  Install dependencies using Yarn:

    ```bash
    yarn install
    ```

### Simulating the Lambda function locally

1.  Create a file called `.env` in the root of the project and define the configuration there:

    ```bash
    GIT_REPO_URI=https://username:token@github.com/example/my-data.git
    GIT_FILE_PATH=clicks.txt
    ```

    You can add a number of other configuration options, see [src/config.ts](src/config.ts) for a full list of what is available.
    In addition to those, you can also set `CLICK_TYPE` (= `SINGLE`, `DOUBLE`, `LONG`) to simulate different button click types.

1.  Once `.env` file is configured, you can run the Lambda function simulation:

    ```bash
    yarn simulate
    ```

Alternatively, you can define the configuration inline, which makes `.env` unnecessary.
Please note that this trick will not work in cmd.exe and PowerShell on Windows.

```bash
GIT_REPO_URI=https://username:token@github.com/example/my-data.git \
GIT_FILE_PATH=clicks.txt \
SOME_OTHER_OPTION=value \
yarn simulate
```

### Quality checking

1.  Ensure that there are no TypeScript errors and that the code is correctly formatted:

    ```bash
    yarn lint
    ```

1.  Ensure that unit tests pass:

    ```bash
    yarn test
    ```

The repository is [continuously checked via Azure Pipelines](https://dev.azure.com/kachkaev/github-pipelines/_build?definitionId=1).
