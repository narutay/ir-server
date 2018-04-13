'use strict';

const dashdbConfig = {};
if (process.env.VCAP_SERVICES) {
  const services = JSON.parse(process.env.VCAP_SERVICES);
  if (services['dashDB For Transactions']) {
    const dashdb = services['dashDB For Transactions'][0].credentials;
    dashdbConfig.hostname = dashdb.host;
    dashdbConfig.port = dashdb.port;
    dashdbConfig.username = dashdb.username;
    dashdbConfig.password = dashdb.password;
    dashdbConfig.database = dashdb.db;
    dashdbConfig.schema = dashdb.username.toUpperCase();
  }
}

module.exports = {
  irdb: {
    name: 'irdb',
    connector: 'dashdb',
    hostname: dashdbConfig.hostname || 'localhost',
    port: dashdbConfig.port || 50000,
    username: dashdbConfig.username || 'username',
    password: dashdbConfig.password || 'password',
    database: dashdbConfig.database || 'BLUDB',
    schema: dashdbConfig.username || 'SCHEMA',
    maxPoolSize: 3,
    supportDashDB: true,
  },
};
