'use strict';

const async = require('async');
const util = require('util');
const request = require('request');

class LogService {

  constructor(service) {
    this.service = service;
  }

  log(message) {
    console.log(`${this.service} ${message}`);
  }

  error(message) {
    console.error(`${this.service} ${message}`);
  }

}

module.exports = LogService;
