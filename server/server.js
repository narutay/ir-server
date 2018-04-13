'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');
const app = module.exports = loopback();

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

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
