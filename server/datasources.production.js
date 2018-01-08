'use strict';

let cloudantUrl = '';
if (process.env.VCAP_SERVICES) {
  const services = JSON.parse(process.env.VCAP_SERVICES);
  if (services.cloudantNoSQLDB) {
    cloudantUrl = services.cloudantNoSQLDB[0].credentials.url;
  }
}

module.exports = {
  irdb: {
    url: cloudantUrl || 'localhost',
    database: 'irdb',
    name: 'irdb',
    modelIndex: '',
    connector: 'cloudant',
    plugin: 'retry',
    retryAttempts: 5,
    retryTimeout: 1000,
  },
};
