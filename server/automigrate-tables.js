'use strict';

const server = require('./server');
const async = require('async');
const debug = require('debug')('irserver:db');

const tables = [
  'user', 'accessToken', 'UserIdentity',
  'UserCredential', 'ACL', 'device', 'message',
];

const ds = server.datasources.irdb;
async.eachSeries(tables, (table, callback) => {
  debug(`Automigrate table [${table}]`, ds.adapter.name);
  ds.automigrate(table, (er) => {
    if (!er) {
      debug(`Table [${table}] created in `, ds.adapter.name);
      callback(null);
    } else {
      debug(`Table [${table}] create failed in `, ds.adapter.name);
      callback(er);
    }
  });
}, (err) => {
  if (!err) {
    debug('automigrate completed');
  } else {
    debug(`automigrate failed ${err}`);
  }
});
ds.disconnect();
