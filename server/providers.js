'use strict';

module.exports = {
  "google-login": {
    provider: "google",
    module: "passport-google-oauth2",
    strategy: "OAuth2Strategy",
    clientID: process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
    callbackURL: "/auth/google/callback",
    authPath: "/auth/google",
    callbackPath: "/auth/google/callback",
    successRedirect: "/",
    failureRedirect: "/login",
    scope: ["email", "profile"],
    failureFlash: true
  }
};
