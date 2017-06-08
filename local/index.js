'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const AWSLambdasBootstrap = require('aws-lambdas-bootstrap');

// Load configuration
const configFilePath = process.argv[2] || './config.json';
console.log(`Using config file '${configFilePath}'`);
const config = JSON.parse(fs.readFileSync(configFilePath));

// Initialize external services
// 'LOCAL' => ENV variables are loaded with 'LOCAL' prefix
// undefined => this service is not running in any real instance env (dev, stage, prod, etc.)
const envConfig = AWSLambdasBootstrap.initializeServices(config, 'LOCAL', undefined);

// Register lambda function services
app.use(bodyParser.json());
config.functions.forEach((f) => {
  console.log(`Registering function '${f.name}' with service '${f.serviceClass}'` +
    ` and method '${f.serviceMethod}'`);
  app.post(`/${f.name}`, (req, res) => {
    if (config.verbose) {
      console.log(`Executing function '${f.name}'`);
      console.log('Request payload:');
      console.log(req.body);
    }

    // Check if the requested service exists
    if (typeof AWSLambdasBootstrap[f.serviceClass] === 'undefined') {
      res.status(400);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        message: 'Requested service does not exist',
        serviceClass: f.serviceClass,
        serviceMethod: f.serviceMethod,
        functionName: f.name,
      }));
      return;
    }

    // Check if the service supports the requested method
    const ServiceClass = AWSLambdasBootstrap[f.serviceClass];
    const service = new ServiceClass();
    if (typeof service[f.serviceMethod] === 'undefined') {
      res.status(400);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        message: 'Requested service method does not exist',
        serviceClass: f.serviceClass,
        serviceMethod: f.serviceMethod,
        functionName: f.name,
      }));
      return;
    }

    // Call the service
    service[f.serviceMethod](req.body, 'dev', envConfig)
      .then((result) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(result));
      })
      .catch((error) => {
        console.log(error);
        res.status(500);
        res.send(error);
      });
  });
});

// Start HTTP server
app.listen(config.port, function () {
  console.log('Local AWSLambdasBootstrap Lambda server running at port ' + config.port);
});
