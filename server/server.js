'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');
const app = module.exports = loopback();
const jwksRsa = require('jwks-rsa');
const jwt = require('express-jwt');
const token = require('../lib/jwt-token');
const debug = require('debug')('irserver:boot');

// Setup the view engine (pug)
const path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const bodyParser = require('body-parser');

// boot scripts mount components like REST API
boot(app, __dirname);

// API ROOT
const apiRoot = app.get('restApiRoot');

// JWT authentication
const auth0Domain = app.get('auth0Domain');
const auth0Audience = app.get('auth0Audience');
const auth0Secret = app.get('auth0Secret');

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 360,
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  }),
  audience: auth0Audience,
  issuer: `https://${auth0Domain}/`,
  algorithms: ['RS256'],
});
app.middleware('auth', [`${apiRoot}`], checkJwt);

const authConfig = {
  secretKey: Buffer.from(auth0Secret).toString('base64').substr(1, 72),
  model: 'user',
  currentUserLiteral: 'me',
  setRequestObjectName: 'user',
};

const mapToken = token(app, authConfig);

app.middleware('auth', [`${apiRoot}`], mapToken);

// to support JSON-encoded bodies
app.middleware('parse', [`${apiRoot}`], bodyParser.json());
// to support URL-encoded bodies
app.middleware('parse', [`${apiRoot}`], bodyParser.urlencoded({
  extended: true,
}));

// db automigrate
const async = require('async');
const tables = ['user', 'device', 'message'];
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

// start the web server
app.start = function() {
  return app.listen(() => {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
