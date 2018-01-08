'use strict';

let applicationRoute = '';
let callbackUrl = '';
if (process.env.VCAP_APPLICATION) {
  const vcapApplications = JSON.parse(process.env.VCAP_APPLICATION);
  applicationRoute = vcapApplications.application_uris[0];
  callbackUrl = `https://${applicationRoute}/auth/google/callback`;
} else {
  callbackUrl = 'http://localhost:3000/auth/google/callback';
}

module.exports = {
  'google-login': {
    provider: 'google',
    module: 'passport-google-oauth2',
    strategy: 'OAuth2Strategy',
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
    callbackURL: callbackUrl,
    authPath: '/auth/google',
    callbackPath: '/auth/google/callback',
    successRedirect: '/',
    failureRedirect: '/login',
    scope: ['email', 'profile'],
    failureFlash: true,
  },
};
