# AWS IoT Button logger to git

This repository contains a [Lambda function](https://aws.amazon.com/lambda/) that can be triggered by an [AWS IoT Button](https://aws.amazon.com/iotbutton/) to log clicks to a chosen git repository.
Doing so is useful when you want to record infrequent arbitrary events over a long period of time and then analyze them.

Example output (e.g. `clicks.txt` in `git@github.com:example/my-data.git`):

```csv
2019-01-20 11:48:42 +0000 SINGLE
2019-01-31 00:42:41 +0000 DOUBLE
2019-01-31 00:43:02 +0000 LONG
2019-02-15 09:10:24 +0000 SINGLE
```

## Configuration

## Deployment

### Using a pre-built version

```
aws lambda update-function-code --function-name aws-iot-button-logger-to-git --zip-file fileb://build.zip
```

### Using your own build

```bash
yarn install
yarn build

aws lambda update-function-code --function-name aws-iot-button-logger-to-git --zip-file fileb://build.zip
```

## Development

```bash
yarn install
yarn lint
yarn test
```
