'use strict';

const LogService = require('./services/log_service.js');
const logger = new LogService('$NAME');

class $SERVICE_CLASS {

  constructor() {
  }

  $SERVICE_METHOD(event, environment, config) {
    return new Promise((resolve, reject) => {
      logger.log(`Got event: ${JSON.stringify(event)}`);
      resolve({});
    });
  }
}

module.exports = $SERVICE_CLASS;
