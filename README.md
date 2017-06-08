AWS Lambdas Bootstrap
=========================

This project contains all the functions that implement your API's backend logic. It runs on [AWS Lambda](https://aws.amazon.com/lambda/details/).

This project uses [Apex](http://apex.run/) to manage the lambda functions. You should learn how Apex works and what features it provides. We wrap most of the functionality provided by Apex in scripts but you may need to use it directly sometimes and you need to know what the scripts are doing. Read the docs. Don't be lazy.

## Setup
### Policies
First, check that your user's IAM Amazon's configuration has the necessary policies, according to [Apex Documentation](http://apex.run/#minimum-iam-policy).
Then, you have to create a Role in the AWS console for the Lambda to be able to perform some tasks on its own. You can call it whatever you want (for example, `aws-lambdas-bootstrap-role`) and then attach the minimum policies it needs to perform all tasks. Note that currently there is only one role for all lambda functions, so it have to collect the policies required by all lambda functions.

A policy every Lambda function should have is `AWSLambdaExecute`, which gives the Lambda permissions to gain full access to Cloudwatch logs and limited access (read and write) over S3.

### Personalization
Once the role is configured with the needed policies, copy its ARN. To use this `<role-arn>` into the current project, you have to paste it in the `PROJECT_ROLE` variable from the `script/setup` script. Also, you can change all the other variables listed there with the desierd ones, i.e., following the same convention for each string, replace `my-project`, `my-project-profile`, `MyProject` and `My Project` as desired.

### Configure your AWS credentials

Apex will get installed during the bootstrap process. In order to use Apex you need to have an AWS account that has access to the lambda service. Apex will look for the AWS credentials in the `~/.aws` directory and expects a profile called `aws-lambdas-bootstrap-profile` to be defined **(you can replace this profile with any desired one at the `script/deploy` file)**. For more information check [Apex's documentation](http://apex.run/#aws-credentials).

It is recommended to install and configure the [AWS command line interface](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) to access the AWS services. The CLI provides a command to configure credentials.

To install AWS CLI if you are using OS X and [Homebrew](http://brew.sh) run `brew install awscli` and then run `aws configure --profile aws-lambdas-bootstrap-profile` (or the profile you have configured).

### Apex on Linux issue
Bash symbolic link (i.e., system shell) is automatically changed on Linux OSs from `bash` to `sh`. Refer to the `docs/apex_on_linux_issue.md` documentation for more information.

### Bootstrap!
Finally, run the `setup` script from the root project folder

```bash
script/setup
```

## Architecture principles

The idea behind using a service like AWS Lambda is that as a developer you only have to focus in the specific function or peace of code that implements a user story or feature. Then the provider, in this case AWS, handles the deployment and provisioning of machines to run the function. It also scales automatically and elastically depending on the traffic. This is transparent to the developer. This follows the "serverless" architecture. If you want to know more about serverless architecture [this](http://martinfowler.com/articles/serverless.html) post is a good introduction.

Each function should have a single responsibility, meaning that it should only do "one thing". This improves maintainability. Although we know and assume that our code will be run in AWS, the actual application logic should be provider agnostic. This is really important for portability and lets us run our functions in a local environment. In practice this means that you shouldn't use any particular feature that is only available in the provider's environment. This also allows us to unit test them. Also in case we decided to change the provider the effort will be minimum.

### Best practices

 - Functions should be stateless.
 - Functions should not call other (lambda) functions.
 - Functions should minimize the use of third party dependencies.
 - Functions should be unit tested.
 - If you need to share code between functions, use a node module or shared library.
 - All IO operations should be non-blocking.

AWS also states some best practices to take into consideration. You can read them [here](http://docs.aws.amazon.com/lambda/latest/dg/best-practices.html).

## Project structure

The project is organized in the following directory structure. This project structure is the one Apex creates when you initialize a new project and we added some files and directories to satisfy our needs.

### `functions` directory

All functions that will be handled by Apex and deployed to AWS Lambda should be stored in the `functions` directory creating a new sub-directory for each function. For more information on how Apex structures function read [this](http://apex.run/#structuring-functions).

Generally speaking you won't need to manage the functions. All you need to care about is the business logic those functions will execute. Functions will be auto-generated using the `script/create_function`. For more information read the [Manage functions](./#manage-functions) section.

### `lib` directory

The `lib` directory is where the actual business logic of the function lives. In order to be able to unit test the function's logic and run them locally you should expose the business logic as services (agnostic of the cloud provider). Each service should be as small as possible. There should be at least one service per function but if the function's logic is too complex is recommended to split it in several services.

Read the [Manage functions](./#manage-functions) section for more information on how services should be created.

### `local` directory

The `local` directory is where the local web server that allows to run the services locally lives. This is all managed automatically for you.

Read the [Local development](./#local-development) section for more information on how to test the functions locally.

### `script` directory

The `script` directory is where all the script that automate several processes live.

## Manage functions

### Create a function

Functions are created automatically using the `script/create_function`. This will create the necessary files under the `functions` directory in order to be able to deploy the function to AWS Lambda using Apex. It will also register the function in the local server in order to be able to test it in your local development environment.

The actual business logic executed by the function should be written in a service which must be cloud provider agnostic. The service shouldn't know anything about the HTTP request cycle nor how code is executed in AWS Lambda. Services are just plain Javascript objects.

#### Example

Lets say that you want to expose a function to create a new firmware object for the clients to know when a new firmware has been released. First you need to create a service that implements the actual logic.

Create a file `lib/firmware-service.js` with the following content

```javascript
"use strict";

const Parse = require('parse/node');

const Firmware = Parse.Object.extend("Firmware");

class FirmwareService {

  constructor(firmwareClass) {
    this.firmwareClass = firmwareClass || Firmware;
  }

  createFirmware(properties) {
    const firmware = new this.firmwareClass();
    return firmware.save(properties);
  }

}

module.exports = FirmwareService;
```

This service object exposes the `createFirmware` method that is responsible for saving a `Firmware` object in Parse with the given properties. Note that the service requires that the Parse class object is passed as a constructor parameter. It has a default value but this allows us to test the `createFirmware` method by mocking the interaction with external services, in this case Parse.

This is a really simple service but in more complex services you may use different external dependencies. All this dependencies should be exposed as constructor parameter so they can be mocked in the unit tests. This is what is called [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection).

Services' constructor method should have default values for all of its parameters. This is really important because when the service is created inside the AWS Lambda context a parameterless constructor will be used.

Is really important that all any external node module is required inside the service. The lambda function should only depend on the services inside the `lib` directory.

Once the service is created you need to create the Apex compatible lambda function and register the service in order to be able to use it locally. Thankfully you can do this by calling `script/create_function`.

The `create_function` script expects three parameters. The name of the function, the service class name and the service method name. In the case of the `FirmwareService` we should invoke the `create_function` script as follows:

```
script/create_function create-firmware FirmwareService createFirmware
```

That will create the following files:

```
functions/create-firmware/index.js
functions/create-firmware/package.json
```

If you take a look at `functions/create-firmware/index.js` you will see something like this:

```javascript
"use strict";

const MyApp = require('dir');
const FirmwareService = MyApp.FirmwareService;
const lambdify = MyApp.lambdify;

const service = new FirmwareService();
exports.handle = lambdify(service.createFirmware.bind(service));
```

Which is basically requiring the `MyApp` module (the code under the `lib` directory), importing the appropriate service class and finally making the service method executable as an AWS Lambda handler. All the specific of AWS Lambda are managed by the `lambdify` function.

The only thing you need to know about AWS Lambda execution model is that the `event` object that is passed to AWS Lambda handler is the object that is passed as the first parameter to the service method. For more information about the AWS Lambda handler read [this](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html).

### Deploy a function

Deployment to AWS Lambda is done using Apex. More on this [here](http://apex.run/#deploying-functions). We use a small script, `script/deploy` to wrap Apex's deploy command to add support for different running environments. By default the `deploy` script will deploy the function using the `dev` environment. You can do this by executing

```
script/deploy create-firmware
```

That will deploy the `create-firmware` function from the previous example and it will create an alias called `create-firmware--dev`. If you want to deploy using the `stage` environment you should pass the environment name as the second argument of the `deploy` script.

```
script/deploy create-firmware stage
```

It is recommend to read about how versioning and aliases work on AWS Lambda. Check the official docs [here](http://docs.aws.amazon.com/lambda/latest/dg/versioning-aliases.html).

### Invoke a function

Invoking a deployed function is very similar to deploy it. We also use Apex's invoke command and we wrap it with a script that adds support for different running environments. By default `script/invoke` will use the `dev` environment.

To call the `create-firmware` function in `dev` mode execute

```
script/invoke create-firmware
```

To call it in `stage` mode execute

```
echo -n '{"version":"0.2.1","archiveURL":"http://example.com"}' | script/invoke create-firmware stage
```

### Managing different environments

AWS Lambda does not provide a native way of having different environments for a function. Apex introduces the concept of environment but at a configuration file level. Meaning that Apex only allows you to define environmental variables that will be exported to the function but once a build is created with a specific environment you cannot change it. You can read more on this [here](http://apex.run/#environment-variables).

We introduce the concept of running environment using AWS Lambda aliases. More on aliases [here](http://docs.aws.amazon.com/lambda/latest/dg/versioning-aliases.html). Basically what we do is create an alias with a prefix with the environment name. For example if we have a `create-firmware` function and we want to deploy it to the `stage` environment, we deploy the latest version of the code and then create an alias called `create-firmware--stage` (the actual ARN also includes the project name which in this case would be `aws-lambdas-bootstrap-create-firmware--stage`).

The `lambdify` function parses the name of the function and extracts the environment name which is then passed to the service method as the second parameter. This is useful in case you want to execute code depending on the running environment. In the following snippet we print the name of the environment:

```javascript
"use strict";

const Parse = require('parse/node');

const Firmware = Parse.Object.extend("Firmware");

class FirmwareService {

  constructor(firmwareClass) {
    this.firmwareClass = firmwareClass || Firmware;
  }

  createFirmware(properties, environment) {
    console.log(`Running in the ${environment} environment`);
    const firmware = new this.firmwareClass();
    return firmware.save(properties);
  }

}

module.exports = FirmwareService;
```

#### Initializing and configuring third party services

Most probably you will need to access third party services, like Parse. Most probably you want different access key or configuration for those services depending on the running environment. The proper way to do that is by using the environment variables that Apex exposes to the AWS Lambda function. Configuration of third party services is done in the `initializeServices` function in the `lib/index.js` file.

`lib/services/env_variables_loader.js`
```javascript
const loadEnvVariables = (config, environment) => {
  const vars = Object.assign({},
    getCommonVars(),
    getVarsForLambdaFunction1(),
    getVarsForLambdaFunction2(),
    // ..., etc.
  );
  loadVarsOnConfig(config, vars, environment);
};
module.exports.loadEnvVariables = loadEnvVariables;
```

In the previous snippet we are loading all the environmental variables for the specified environment. This structure help us to maintain variables grouped by function and let us know which variables are related to which lambda function. Each function inside the `Object.assign` method should be mapping a programmatic variable name (i.e.: the one that will be used in the code) with one environment variable defiend at each config file (one per environment), for example, by doing

```javascript
const getCommonVars = () => {
  const vars = {};
  vars.sampleApiUrl = 'SAMPLE_API_URL';
  vars.apiVersion = 'API_VERSION';
  return vars;
};
```

Under the hood, the `loadVarsOnConfig` function (called at `loadEnvVariables`) prepends the name of the environment to the variable name and then reads it from the process environment. For example for the environmental variable `SAMPLE_API_URL` in the `stage` environment we end up reading the `STAGE_SAMPLE_API_URL` environmental variable.

Environmental variables are defined in the config folder, where there is one file per environment with the name `project-${environment}.json`, which are auto-generated to avoid adding credentials to the git repository. The proper way to add a an environmental variable is by modifying the `script/configure_env` script file. This script is executed as part of the bootstrapping process to generate all `project-${environment}.json` files with the environmental variables for all environments (currently: `local`, `dev`, `stage`, `prod`).

If you want to generate environmental variables and update any `project-${environment}.json` file for a particular environment, for example `stage`, run the following command:

```
script/configure_env stage
```

The `configure_env` script prompts the value for each environmental variable and then creates or updates the corresponding `project-${environment}.json` file.

##### Important
Please bare in mind that the `project-${environment}.json` file is the one that should be updated with all the desired private environmental variables. Also, recall that these files won't be updated, so it is recommended that you find a way of sharing these files accross all developers, so as to keep them constantly updated.

## Local development

AWS Lambda and Apex does not provide to run the functions locally. To solve this issue and make development easier we provide a [ExpressJS](http://expressjs.com/) application that lets you call functions over HTTP.

When you create a service and call the `create_function` script, apart from creating an AWS Lambda handler, the service is registered in the local server. You can update the local server configuration file manually if you want, `local/config.json`, but using the `create_function` is the recommended way.

Once a function has been registered you can run the local server by executing `script/server`. A HTTP server will be started running that `http://localhost:3030`. Then you can call a function by sending an HTTP POST request to the URL with the name of the function. For example:

```
curl -v -H "Content-Type: application/json" -X POST -d '{"version":"0.2.1","archiveURL":"http://example.com"}' "http://localhost:3000/create-firmware"
```

The client code that uses the AWS Lambda function should know wether to use a local HTTP request or invoke the AWS Lambda function using the AWS SDK depending on the running environment.

If you want to change the level of verbosity or the port where the server is running you can edit the `local/config.json` file.

## TODO
You can contribute with any of the following!

 - [x] Configure linter, probably [ESlint](http://eslint.org/).
 - [ ] Configure unit test library. ([Mocha](https://mochajs.org/) + [Chai](http://chaijs.com/) + [Karma](https://karma-runner.github.io/1.0/index.html))
 - [ ] Configure CI and code analysis tool.
 - [ ] Configure deployment through CI builds.
 - [ ] Consider adding [Flow](https://flowtype.org/) for type checking.

 ## Contributing

 1. Fork it
 2. Create your feature branch (`git checkout -b my-new-feature`)
 3. Commit your changes (`git commit -am 'Add some feature'`)
 4. Push your branch (`git push -u origin my-new-feature`)
 5. Create a new Pull Request

 ## About

 This project is maintained by [Guido Marucci Blass](https://github.com/guidomb) along with [Matías Nicolás Comercio Vázquez](https://github.com/MatiasComercio) and it is written by [Wolox](http://www.wolox.com.ar).

 ![Wolox](https://raw.githubusercontent.com/Wolox/press-kit/master/logos/logo_banner.png)

 ## License

 **aws-lambdas-bootstrap** is available under the MIT [license](LICENSE).

     Copyright (c) 2017 Wolox

     Permission is hereby granted, free of charge, to any person obtaining a copy
     of this software and associated documentation files (the "Software"), to deal
     in the Software without restriction, including without limitation the rights
     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the Software is
     furnished to do so, subject to the following conditions:

     The above copyright notice and this permission notice shall be included in
     all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     THE SOFTWARE.
