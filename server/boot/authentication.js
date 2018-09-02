'use strict';

module.exports = function enableAuthentication(app) {
  app.enableAuth();

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
    config = require('../providers.js');
  } catch (err) {
    console.trace(err);
    process.exit(1);
  }

  // to support JSON-encoded bodies
  app.middleware('parse', bodyParser.json());
  // to support URL-encoded bodies
  app.middleware('parse', bodyParser.urlencoded({
    extended: true,
  }));

  app.set('trust proxy', 1);
  app.middleware('session:before', cookieParser(app.get('cookieSecret')));
  app.middleware('session', session({
    secret: app.get('sessionSecret'),
    saveUninitialized: false,
    resave: false,
    rolling: true,
    cookie: {
      secure: app.get('sessionSecure'),
      maxAge: 1000 * 60 * 60 * 24 * 14, //14 days
    },
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
};
