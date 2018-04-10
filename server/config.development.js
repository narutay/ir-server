'use strict';

let iotCredentials = {
  apiKey: 'YOUR_API_KEY',
  apiToken: 'YOUR_API_TOKEN',
  iotCredentialsIdentifier: 'YOUR_ID',
  org: 'YOUR_ORG',
  mqtt_host: 'localhost',
  mqtt_s_port: '3000',
};

if (process.env.VCAP_SERVICES) {
  const services = JSON.parse(process.env.VCAP_SERVICES);
  if (services['iotf-service']) {
    iotCredentials = services['iotf-service'][0].credentials;
  }
}

module.exports = {
  hostname: process.env.VCAP_APP_HOST | '0.0.0.0',
  port: process.env.PORT || 3000,
  restApiRoot: '/api',
  cookieSecret: process.env.COOKIE_SECRET || 'keyboard cat',
  sessionSecret: process.env.SESSION_SECRET || 'keyboard cat',
  iotCredentials: iotCredentials,
};
