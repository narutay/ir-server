'use strict';

let iotKey = 'YOUR_IOT_KEY';
let iotToken = 'YOUR_IOT_TOKEN';
let iotUrl = 'http://localhost';

if (process.env.VCAP_SERVICES) {
  const services = JSON.parse(process.env.VCAP_SERVICES);
  if (services['iotf-service']) {
    const iotHost = services['iotf-service'][0].credentials.mqtt_host;
    const iotPort = services['iotf-service'][0].credentials.mqtt_s_port;
    iotUrl = `https://${iotHost }:${iotPort}`;
    iotKey = services['iotf-service'][0].credentials.apiKey;
    iotToken = services['iotf-service'][0].credentials.apiToken;
  }
}

module.exports = {
  hostname: process.env.VCAP_APP_HOST | '0.0.0.0',
  port: process.env. VCAP_APP_HOST || 3000,
  restApiRoot: '/api',
  cookieSecret: process.env.COOKIE_SECRET || 'keyboard cat',
  sessionSecret: process.env.SESSION_SECRET || 'keyboard cat',
  iotKey: iotKey,
  iotToken: iotToken,
  iotUrl: iotUrl,
  remoting: {
    errorHandler: {
      disableStackTrace: true,
    },
  },
};
