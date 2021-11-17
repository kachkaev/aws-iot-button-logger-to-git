# AWS IoT Button logger to git

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub Workflow Status (checks)](https://img.shields.io/github/workflow/status/kachkaev/aws-iot-button-logger-to-git/Checks?label=checks)](https://github.com/kachkaev/aws-iot-button-logger-to-git/actions?query=workflow%3AChecks)
[![Known vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/kachkaev/aws-iot-button-logger-to-git.svg)](https://snyk.io/test/github/kachkaev/aws-iot-button-logger-to-git?targetFile=package.json)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

This repository contains a [Lambda function](https://aws.amazon.com/lambda/) that can be triggered by an [AWS IoT Button](https://aws.amazon.com/iotbutton/) to log clicks in a chosen git repository.
Doing so is useful when you want to record arbitrary infrequent events and then analyze them.

The function can be triggered by any Lambda event, such as from [AWS 1-Click IoT devices](https://aws.amazon.com/iot-1-click/) or [Alexa Smart Home](https://developer.amazon.com/docs/smarthome/steps-to-build-a-smart-home-skill.html).

![Process diagram: trigger (e.g. AWS IoT Button) starts this Lambda function and passes clickTypes. The function clones a git repository to obtain files, adds a line to a file, commits and pushes back to the repository](process-diagram.png)

Example output (e.g. `clicks.txt` in `https://github.com/example/my-data.git`):

```csv
2019-01-20 11:48:42 +0000 SINGLE
2019-01-31 00:42:41 +0000 DOUBLE
2019-01-31 00:43:02 +0000 LONG
2019-02-15 09:10:24 +0000 SINGLE
```

## Caveats

- Due to the nature of AWS Lambda and git, writing to a repository requires its shallow cloning on every function invocation.
  The whole process takes a few seconds, which limits the frequency of events you can log.
  If you trigger the function too often, git conflicts may emerge when pushing, so some events may fail to appear in your log file.

- Batteries in AWS IoT buttons last for ≈1,000–2,000 presses and are not officially replaceable.
  You can still use this Lambda function if you intend to log more events, just consider using other triggers (e.g. [Alexa Smart Home](https://developer.amazon.com/docs/smarthome/steps-to-build-a-smart-home-skill.html)).

- The git repository you are writing to cannot be blank and requires to have at least one commit on the branch of your choice (`main` by default).

## Configuration

The function is configured via environment variables, which define the target repository as well as the format of the created log.
See [src/config.ts](src/config.ts) for the list of options.

## Deployment

1.  **Obtain the archive with the lambda function**

    - _Using a pre-built version from GitHub_  
      Simply download <https://github.com/kachkaev/aws-iot-button-logger-to-git/releases/latest/download/lambda.zip>

    - _Using your own build from source_

      ```sh
      git clone https://github.com/kachkaev/aws-iot-button-logger-to-git.git
      cd aws-iot-button-logger-to-git
      
      yarn install
      yarn build
      
      ## lambda.zip will appear in the project folder
      ```

1.  **Create a new Lambda function on AWS**  
    See [official documentation](https://docs.aws.amazon.com/lambda/latest/dg/getting-started-create-function.html).
    You should end up on the function’s configuration page at the end of this step.

1.  **Upload function code and configure its execution**

    - Press _Upload_ in the _Function code_ block and select a copy of `lambda.zip` on you computer.
    - Set _Runtime_ to _Node 14.x_ and _Basic settings_ → _Timeout_ to _15 sec_.
    - Press _Add a layer_ and provide ARN from [git-lambda-layer](https://github.com/lambci/git-lambda-layer) repo (e.g. `arn:aws:lambda:us-east-1:553035198032:layer:git-lambda2:8` if your function is in `us-east-1` region and you want to use git `2.29.0`).

1.  **Set environment variables**  
    It is necessary to set at least two environment variables, otherwise the function will not succeed.
    These are `GIT_REPO_URI` and `GIT_FILE_PATH`.

    An example for `GIT_REPO_URI` would be `https://username:token@github.com/example/my-data.git`.
    The value must use HTTPS protocol and contain username and token (SSH protocol is not supported).
    Omitting `username` and `token` from the URL will make it impossible for the function to push the changes back to the source repository.
    Token generation process will vary based on where your repository is hosted (e.g. see docs for [Github](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) and [GitLab](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)).
    Make sure you give your new token write permissions to the repository of your choice.

    `GIT_FILE_PATH` must contain a relative path to the log file you want to populate, e.g. `path/to/clicks.txt`.
    The file and the containing folder do not need to exist beforehand.

    Although other environment variables are not required, there exist quite a few of them to let you customize what the function does.
    For example, you can configure the format of the timestamps and bring your own labels.
    So your output file can look like this:

    ```sh
    ## my-data.csv
    2019/01/20,11:48:42,my custom event 1 (clicked)
    2019/01/31,00:42:41,my custom event 2 (double-clicked)
    2019/01/31,00:43:02,my custom event 3 (long-clicked)
    2019/02/15,09:10:24,my custom event 1 (clicked)
    ```

    Details are in [src/config.ts](src/config.ts).

1.  **Save the changes you’ve made to your function**  
    Press _Save_ in the top right corner function’s page and wait for the zip archive to upload.
    You can now run your function by pressing _Test_ next to _Save_.
    Using this button for the first time will prompt you to configure a test event.
    For example, you can name it `clickTypeDouble` and paste `{"clickType": "DOUBLE"}` into the event body.
    Such payload will simulate a double-click.

1.  **Link your IoT button or another AWS IoT device to the function**  
    Follow the instructions for your device to link it with AWS.
    You can start by clicking _Add Triggers_ → _AWS IoT_ section in the top-left corner of your function’s configuration page.

1.  **Press the button and refresh you git repository in ≈10 seconds**

1.  ## 🎉

## Development

### Getting started

1.  Ensure you have the latest git, Node.js and Yarn installed:

    ```sh
    git --version
    ## ≥ 2.3
    
    node --version
    ## ≥ v10.21.0
    
    yarn --version
    ## ≥ 1.21.1
    ```

1.  Clone the repository:

    ```sh
    cd PATH/TO/MISC/PROJECTS
    git clone https://github.com/kachkaev/aws-iot-button-logger-to-git.git
    cd aws-iot-button-logger-to-git
    ```

1.  Install dependencies using Yarn:

    ```sh
    yarn install
    ```

### Simulating the function locally

1.  Create a file called `.env` in the root of the project and define the configuration there:

    ```sh
    GIT_REPO_URI=https://username:token@github.com/example/my-data.git
    GIT_FILE_PATH=clicks.txt
    ```

    You can add a number of other configuration options; see [src/config.ts](src/config.ts) for a full list of what is available.
    In addition to those, you can also set `CLICK_TYPE` (= `SINGLE`, `DOUBLE`, `LONG`) to simulate different button click types.

1.  Once `.env` file is configured, you can trigger the function:

    ```sh
    yarn simulate
    ```

Alternatively, you can define the configuration inline, which makes `.env` unnecessary.
Please note that the below syntax will not work in cmd.exe and PowerShell on Windows.

```sh
GIT_REPO_URI=https://username:token@github.com/example/my-data.git \
  GIT_FILE_PATH=clicks.txt \
  SOME_OTHER_OPTION=value \
  yarn simulate
```

### Quality checking

1.  Ensure that there are no TypeScript errors and that the code is correctly formatted:

    ```sh
    yarn lint
    ```

1.  Ensure that unit tests pass:

    ```sh
    yarn test
    ```

The repository is [continuously checked via GitHub Actions](https://github.com/kachkaev/aws-iot-button-logger-to-git/actions).
