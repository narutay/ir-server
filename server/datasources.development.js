'use strict';

const dashdbConfig = {
  hostname: process.env.DASHDB_HOSTNAME || 'DASHDB_HOSTNAME',
  port: process.env.DASHDB_PORTNUM || 'DASHDB_PORTNUM',
  username: process.env.DASHDB_USERNAME || 'DASHDB_USERNAME',
  password: process.env.DASHDB_PASSWORD || 'DASHDB_PASSWORD',
  database: process.env.DASHDB_DATABASE || 'BLUDB',
  schema: process.env.DASHDB_SCHEMA || 'DASHDB_SCHEMA',
};

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
    maxPoolSize: 2,
    supportDashDB: true,
  },
};
