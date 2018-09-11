'use strict';

const debug = require('debug')('irserver:config');
const cfenv = require('cfenv');
require('dotenv').config();

const env = (process.env.NODE_ENV || 'development');
const isDevEnv = env === 'development' || env === 'test';

let vcapLocal = null;
try {
  vcapLocal = require('./vcap-local.json');
} catch (e) {
  debug('not found valid vcap-local.json.');
}

const appEnvOpts = vcapLocal ? {vcap: vcapLocal} : {};
const appEnv = cfenv.getAppEnv(appEnvOpts);
const services = appEnv.services;

let iotCredentials = null;
let nlcCredentials = null;
let sttCredentials = null;

if (services['iotf-service']) {
  iotCredentials = services['iotf-service'][0].credentials;
}
if (services['natural_language_classifier']) {
  nlcCredentials = services['natural_language_classifier'][0].credentials;
}
if (services['speech_to_text']) {
  sttCredentials = services['speech_to_text'][0].credentials;
}

const messageClassDisplayName = require('../lib/message-class.json');

const sessionSecure = isDevEnv ? false : true;

module.exports = {
  hostname: process.env.VCAP_APP_HOST | '0.0.0.0',
  port: process.env.PORT || 3000,
  restApiRoot: '/api',
  cookieSecret: process.env.COOKIE_SECRET || 'keyboard cat',
  sessionSecret: process.env.SESSION_SECRET || 'keyboard cat',
  sessionSecure: sessionSecure,
  iotCredentials: iotCredentials,
  nlcCredentials: nlcCredentials,
  sttCredentials: sttCredentials,
  nlcClassifierName: process.env.NLC_CLASSIFIER_NAME || 'home_control',
  messageClassDisplayName: messageClassDisplayName,
  remoting: {
    errorHandler: {
      disableStackTrace: true,
    },
  },
};
