'use strict';

const iotCredentials = {
  org: process.env.IOT_ORG || null,
  id: process.env.IOT_ID || null,
  apiKey: process.env.IOT_APIKEY || null,
  apiToken: process.env.IOT_APITOKEN || null,
};

if (process.env.VCAP_SERVICES) {
  const services = JSON.parse(process.env.VCAP_SERVICES);
  if (services['iotf-service']) {
    const credentials = services['iotf-service'][0].credentials;
    iotCredentials.org = credentials.org;
    iotCredentials.id = credentials.iotCredentialsIdentifier;
    iotCredentials.apiKey = credentials.apiKey;
    iotCredentials.apiToken = credentials.apiToken;
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
