'use strict';

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Reads an environmental variable for the given
 * environment.
 *
 * The function have access to all the environment
 * variables. Lets say you want to define a variable
 * called SOME_VARIABLE and you have the 'stage' and
 * 'prod' environments. Then you need to define
 * 'STAGE_SOME_VARIABLE' and 'PROD_SOME_VARIABLE' in
 * environment property in either the project.json or
 * function.json apex's files.
 *
 * @param variable The name of the variable to be read.
 * @param environment The environment from which to read
 * the variable.
 *
 * @return The value of the environment.
 */
const readEnvVariable = function (variable, environment) {
  let key;
  if (typeof environment === 'undefined') {
    key = variable;
  } else {
    key = `${environment.toUpperCase()}_${variable}`;
  }
  return process.env[key];
};

const loadVarsOnConfig = (config, vars, environment) => {
  Object.keys(vars).forEach((key) => {
    config[key] = config[key] || readEnvVariable(vars[key], environment);
  });
};

const getCommonVars = () => {
  const vars = {};
  vars.sampleApiUrl = 'SAMPLE_API_URL';
  vars.apiVersion = 'API_VERSION';
  return vars;
};

const loadEnvVariables = (config, environment) => {
  const vars = Object.assign({},
    getCommonVars()
  );
  loadVarsOnConfig(config, vars, environment);
};
module.exports.loadEnvVariables = loadEnvVariables;
