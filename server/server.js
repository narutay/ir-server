'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');
const app = module.exports = loopback();

// Setup the view engine (pug)
const path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// for Passport login
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');

// Passport configurations
const loopbackPassport = require('loopback-component-passport');
const PassportConfigurator = loopbackPassport.PassportConfigurator;
const passportConfigurator = new PassportConfigurator(app);

// Build the providers/passport config
let config = {};
try {
  config = require('./providers.js');
} catch (err) {
  console.trace(err);
  process.exit(1);
}

// boot scripts mount components like REST API
boot(app, __dirname);

// The access token is only available after boot
app.middleware('auth', loopback.token({
  model: app.models.accessToken,
  currentUserLiteral: 'me',
}));

// to support JSON-encoded bodies
app.middleware('parse', bodyParser.json());
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({
  extended: true,
}));

app.middleware('session:before', cookieParser(app.get('cookieSecret')));
app.middleware('session', session({
  secret: app.get('sessionSecret'),
  saveUninitialized: false,
  resave: true,
}));
passportConfigurator.init();

passportConfigurator.setupModels({
  userModel: app.models.user,
  userIdentityModel: app.models.userIdentity,
  userCredentialModel: app.models.userCredential,
});
for (const s in config) {
  const c = config[s];
  c.session = c.session !== false;
  passportConfigurator.configureProvider(s, c);
}

app.start = function() {
  // start the web server
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

// autoupdata ir db
const ds = app.datasources.irdb;

const lbTables1 = [
  'user', 'accessToken', 'UserIdentity',
];
ds.autoupdate(lbTables1, (er) => {
  if (er) throw er;
  console.log(`Loopback tables [${ lbTables1 }] created in `, ds.adapter.name);
});

const lbTables2 = [
  'UserCredential', 'ACL', 'device', 'message',
];
ds.autoupdate(lbTables2, (er) => {
  if (er) throw er;
  console.log(`Loopback tables [${ lbTables2 }] created in `, ds.adapter.name);
});

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
