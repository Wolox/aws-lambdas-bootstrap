'use strict';

const AWSLambdasBootstrap = require('aws-lambdas-bootstrap');
const $SERVICE_CLASS = AWSLambdasBootstrap.$SERVICE_CLASS;
const lambdify = AWSLambdasBootstrap.lambdify;

const service = new $SERVICE_CLASS();
exports.handle = lambdify(service.$SERVICE_METHOD.bind(service));
