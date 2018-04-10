'use strict';

let dashdb = {};
if (process.env.VCAP_SERVICES) {
  const services = JSON.parse(process.env.VCAP_SERVICES);
  if (services['dashDB For Transactions']) {
    dashdb = services['dashDB For Transactions'][0].credentials;
  }
}

module.exports = {
  irdb: {
    name: 'irdb',
    connector: 'dashdb',
    hostname: dashdb.host || 'localhost',
    port: dashdb.port || 50000,
    username: dashdb.username || 'username',
    password: dashdb.password || 'password',
    database: dashdb.db || 'BLUDB',
    schema: dashdb.username.toUpperCase() || 'SCHEMA',
    maxPoolSize: 4,
  },
};
