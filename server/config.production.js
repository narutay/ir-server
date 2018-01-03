'use strict';

module.exports = {
  hostname: process.env.VCAP_APP_HOST | "0.0.0.0",
  port: process.env. VCAP_APP_HOST || 3000,
  restApiRoot: "/api",
  cookieSecret: process.env.COOKIE_SECRET || "keyboard cat",
  sessionSecret: process.env.SESSION_SECRET || "keyboard cat",
  remoting: {
    errorHandler: {
      disableStackTrace: true
    }
  }
};
