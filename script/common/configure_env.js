'use strict';

const fs = require('fs');
const readline = require('readline');

const environment = process.argv[2];
if (typeof environment === 'undefined') {
  console.log('You need to provide the environment name');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (obj, message, key) => {
  return new Promise((resolve) => {
    rl.question(message, (value) => {
      const pair = { [key]: value, };
      resolve(Object.assign(obj, pair));
    });
  });
};

const env = (variable) => {
  return `${environment.toUpperCase()}_${variable}`;
};

const configureEnv = (env) => {
  console.log(`Configuring basic environmental variables for environment ${env} ...`);
  let projectConfig = {};
  const projectFile = `config/project-${env}.json`;
  const projectConfigFile = `config/project-config-${env}.json`;
  try {
    fs.accessSync(projectFile, fs.R_OK | fs.W_OK);
    console.log(`Updating ${projectFile}...`);
    projectConfig = JSON.parse(fs.readFileSync(projectFile));
  } catch (e) {
    console.log(`Creating ${projectFile}...`);
    projectConfig = JSON.parse(fs.readFileSync(projectConfigFile));
  } finally {
    projectConfig.environment = projectConfig.environment || {};
    fs.writeFileSync(projectFile, JSON.stringify(projectConfig, null, 2));
    process.exit(0);
  }
  console.log(`[OK] - ${env} configuration. Please ask a teammate for a full` +
   `'${projectFile}' env variables file`);
};

configureEnv(environment);
