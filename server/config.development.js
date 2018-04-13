'use strict';

const iotCredentials = {
  org: process.env.IOT_ORG || null,
  id: process.env.IOT_ID || null,
  apiKey: process.env.IOT_APIKEY || null,
  apiToken: process.env.IOT_APITOKEN || null,
};

module.exports = {
  hostname: '0.0.0.0',
  port: process.env.PORT || 3000,
  restApiRoot: '/api',
  cookieSecret: process.env.COOKIE_SECRET || 'keyboard cat',
  sessionSecret: process.env.SESSION_SECRET || 'keyboard cat',
  iotCredentials: iotCredentials,
};
