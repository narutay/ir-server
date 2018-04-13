'use strict';

const iotCredentials = {
  org: process.env.IOT_ORG || 'YOUR_ORG',
  id: process.env.IOT_ID || 'YOUR_ID',
  apiKey: process.env.IOT_APIKEY || 'YOUR_API_KEY',
  apiToken: process.env.IOT_APITOKEN || 'YOUR_API_TOKEN',
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
  remoting: {
    errorHandler: {
      disableStackTrace: true,
    },
  },
};
