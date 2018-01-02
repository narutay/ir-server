'use strict';

var cfenv = require( 'cfenv' );
var appEnv = cfenv.getAppEnv();

module.exports = {
  hostname: appEnv.bind || "0.0.0.0",
  port: appEnv.port || 3000,
  restApiRoot: "/api",
  cookieSecret: process.env.COOKIE_SECRET || "keyboard cat",
  sessionSecret: process.env.SESSION_SECRET || "keyboard cat"
};
