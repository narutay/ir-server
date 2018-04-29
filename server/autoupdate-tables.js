'use strict';

const app = require('./server');
const async = require('async');
const debug = require('debug')('irserver:db');

const tables = [
  'user', 'accessToken', 'UserIdentity',
  'UserCredential', 'ACL', 'device', 'message',
];

const ds = app.datasources.irdb;
async.eachSeries(tables, (table, callback) => {
  debug(`Autoupdate table [${table}]`, ds.adapter.name);
  ds.autoupdate(table, (er) => {
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
    debug('autoupdate completed');
  } else {
    debug(`autoupdate failed ${err}`);
  }
});
ds.disconnect();
