'use strict';

var cfenv = require( 'cfenv' );
var appEnv = cfenv.getAppEnv();
var appService = appEnv.getService(cloudantNoSQLDB);

module.exports = {
  irdb: {
    url: appService.url || 'localhost',
    database: 'irdb',
    name: 'irdb',
    modelIndex: "",
    connector: 'cloudant',
    plugin: "retry",
    retryAttempts: 5,
    retryTimeout: 1000
  }
};
