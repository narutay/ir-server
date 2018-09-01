'use strict';

const debug = require('debug')('irserver:config');
const cfenv = require('cfenv');

const env = (process.env.NODE_ENV || 'development');
const isDevEnv = env === 'development' || env === 'test';

let vcapLocal = null;
try {
  vcapLocal = require('./vcap-local.json');
} catch (e) {
  debug('not found valid vcap-local.json.');
}

const appEnvOpts = vcapLocal ? {vcap: vcapLocal} : {};
const appEnv = cfenv.getAppEnv(appEnvOpts);
const services = appEnv.services;

let dashdb = null;
if (services['dashDB For Transactions']) {
  dashdb = services['dashDB For Transactions'][0].credentials;
}

const maxPoolSize = isDevEnv ? 2 : 3;

const dashdbConfig = {
  name: 'irdb',
  connector: 'dashdb',
  hostname: dashdb.host || 'localhost',
  port: dashdb.port || 50000,
  username: dashdb.username || 'username',
  password: dashdb.password || 'password',
  database: dashdb.db || 'BLUDB',
  schema: dashdb.username.toUpperCase() || 'SCHEMA',
  maxPoolSize: maxPoolSize,
  supportDashDB: true,
};

const memoryConfig = {
  name: 'irdb',
  connector: 'memory',
};

let irdb = null;
if (process.env.USE_MEMORY === 'true') {
  irdb = memoryConfig;
} else {
  irdb = dashdbConfig;
}

module.exports = {irdb: irdb};
