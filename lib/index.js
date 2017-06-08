'use strict';

const AWS = require('aws-sdk'),
  metrics = require('datadog-metrics');
const envVariablesLoader = require('./services/env_variables_loader.js');

// Functions definitions should be below this line
// ### EXPORTED_FUNCTIONS-DO_NOT_DELETE_COMMENT ###
/**
 * Returns the environment in which the lambda
 * function is running.
 *
 * In order to know which environment the function
 * is running, we assume that the environment name
 * added to the function ARN. For example lets say
 * you have a function called 'foo' and you have
 * 2 environments: stage and prod. You should
 * deploy two alias for the 'foo' funciton:
 * 'foo--stage' and 'foo--prod'.
 * Then if you want to run the 'foo' function
 * in the 'stage' environment you should call
 * the function using the 'foo--stage' alias.
 *
 * @param context The context object passed to the
 * AWS lambda function.
 *
 * @return The current environment in which the
 * lambda function called.
 */
const getEnvironment = function (context) {
  const splitFunctionName = context.functionName.split('-');
  return splitFunctionName[splitFunctionName.length - 1];
};
module.exports.getEnvironment = getEnvironment;

/**
 * Initializes all external services that may be
 * used by the lambda functions.
 *
 * @param config A configuration object will the properties
 * that each services needs.
 * @param environment The environment in which the lambda
 * function will be used.
 */
const initializeServices = function (config, environment, context) {
  config = config || {};
  envVariablesLoader.loadEnvVariables(config, environment);
  return config;
};
module.exports.initializeServices = initializeServices;

/**
 * Wraps a functions to be able to execute it as a
 * AWS Lambda handler.
 *
 * Before calling the lambdified function all external
 * services will be initialized.
 *
 * @param {function} f The function to be 'lambdify'. This function
 * should receive an object as the only mandatory parameter which would
 * be the event object passed to the AWS Lambda handler.
 * Also the environment in which this functions was
 * called will be passed as the second argument.
 * It must return a promise. If the promise succeeds the lambda
 * handler's callback will be invoked passing the promise
 * resolved value as the response object.
 * If the promise fails the lambda handler's callback will
 * be invoked passing the promise error as the error object.
 * @param {object} [config={}] An object holding the external
 * services configuration.
 *
 * @return A lambdified version of the function ready to be
 * used a AWS lambda handler function.
 */
const lambdify = function(f, config) {
  return (event, context, callback) => {
    const environment = getEnvironment(context);
    console.log(`Initializing services for environment '${environment}'` +
      ` to call function '${context.functionName}' ...`);
    const envConfig = initializeServices(config, environment, context);
    const onSuccess = (response) => {
      console.log('Service executed successfully');
      context.done(null, response);
    };
    const onError = (error) => {
      console.log(`Error while executing service ${JSON.stringify(error)}`);
      context.done(error, event);
    };
    console.log(`Executing function '${context.functionName}'` +
      ` for environment '${environment}' ...`);
    f(event, context, envConfig).then(onSuccess, onError);
  };
};
module.exports.lambdify = lambdify;
