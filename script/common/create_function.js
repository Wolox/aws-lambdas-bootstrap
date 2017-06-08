'use strict';

const fs = require('fs');

const name = process.argv[2];
const serviceClass = process.argv[3];
const serviceMethod = process.argv[4];
const errorExplanation = 'The expected arguments are {name} {serviceClass} {serviceMethod}';

if (typeof name === 'undefined') {
  console.log('You need to provide the function name');
  console.log(errorExplanation);
  process.exit(1);
}
if (typeof serviceClass === 'undefined') {
  console.log('You need to provide the service class');
  console.log(errorExplanation);
  process.exit(1);
}
if (typeof serviceMethod === 'undefined') {
  console.log('You need to provide the service method');
  console.log(errorExplanation);
  process.exit(1);
}

// 1 - Create apex compatible AWS labmda function
//
// 1.1 - Create function directory
const functionDir = `./functions/${name}`;
console.log(`Creating directory '${functionDir}' ...`);
fs.mkdirSync(functionDir, '0755');

// 1.2 - Create package.json file
const packageFilePath = `${functionDir}/package.json`;
console.log(`Creating file '${packageFilePath}' ...`);
const packageFile = fs.readFileSync('script/common/function_template/package.json',
  { encoding: 'utf8', }).replace(/\$NAME/g, `aws-lambdas-bootstrap-${name}`);
fs.writeFileSync(packageFilePath, packageFile);

// 1.3 - Create index.js file
const indexFilePath = `${functionDir}/index.js`;
console.log(`Creating file '${indexFilePath}' ...`);
const indexFile = fs.readFileSync('script/common/function_template/index.js',
  { encoding: 'utf8', })
  .replace(/\$SERVICE_CLASS/g, serviceClass)
  .replace(/\$SERVICE_METHOD/g, serviceMethod);
fs.writeFileSync(indexFilePath, indexFile);

// 2 - Update local server configuration
const configFilePath = './local/config.json';
console.log(`Updating local serve config file '${configFilePath}' ...`);
const config = JSON.parse(fs.readFileSync(configFilePath));
config.functions.push({
  name,
  serviceClass,
  serviceMethod,
});
fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));

// 3 - Create file for service
// This regex converts CamelCase to snake_case.
const serviceFileName = serviceClass.replace(/([A-Z])/g, function($1) {
  return '_' + $1.toLowerCase();
}).substring(1);
const serviceFilePath = `./lib/${serviceFileName}.js`;
console.log(`Creating file '${serviceFilePath}' ...`);
const serviceFile = fs.readFileSync('script/common/function_template/service.js',
  { encoding: 'utf8', })
  .replace(/\$NAME/g, name)
  .replace(/\$SERVICE_CLASS/g, serviceClass)
  .replace(/\$SERVICE_METHOD/g, serviceMethod);
fs.writeFileSync(serviceFilePath, serviceFile);

// 4 - Export new service class (from the lib's index file)
const EXPORT_LINE = '// ### EXPORTED_FUNCTIONS-DO_NOT_DELETE_COMMENT ###';
const newFunctionExportStatement =
  `module.exports.${serviceClass} = require('./${serviceFileName}.js');\n${EXPORT_LINE}`;
const libIndexFilePath = './lib/index.js';
const libIndexFile = fs.readFileSync(libIndexFilePath,
  { encoding: 'utf8', })
  .replace(EXPORT_LINE, newFunctionExportStatement);
fs.writeFileSync(libIndexFilePath, libIndexFile);

console.log('\nFiles created.');
