'use strict';

let iotCredentials = null;
let nlcUrl = 'http://localhost';
let nlcUsername = 'NLCUSERNAME';
let nlcPassword = 'NLCPASSWORD';

if (process.env.VCAP_SERVICES) {
  const services = JSON.parse(process.env.VCAP_SERVICES);
  if (services['iotf-service']) {
    const credentials = services['iotf-service'][0].credentials;
    iotCredentials = {};
    iotCredentials.org = credentials.org;
    iotCredentials.id = credentials.iotCredentialsIdentifier;
    iotCredentials.apiKey = credentials.apiKey;
    iotCredentials.apiToken = credentials.apiToken;
  }
  if (services['natural_language_classifier']) {
    const credentials = services['natural_language_classifier'][0].credentials;
    nlcUrl = credentials.url;
    nlcUsername = credentials.username;
    nlcPassword = credentials.password;
  }
}

module.exports = {
  hostname: process.env.VCAP_APP_HOST | '0.0.0.0',
  port: process.env.PORT || 3000,
  restApiRoot: '/api',
  iotCredentials: iotCredentials,
  cookieSecret: process.env.COOKIE_SECRET || 'keyboard cat',
  sessionSecret: process.env.SESSION_SECRET || 'keyboard cat',
  sessionSecure: true,
  nlcUrl: nlcUrl,
  nlcUsername: nlcUsername,
  nlcPassword: nlcPassword,
  nlcClassifierId: process.env.NLC_CLASSIFIER_ID || 'NLC_CLASSIFIER_ID',
  remoting: {
    errorHandler: {
      disableStackTrace: true,
    },
  },
};
