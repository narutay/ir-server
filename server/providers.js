'use strict';

var applicationRoute;
if (process.env.VCAP_APPLICATION ){
  var vcapApplications = JSON.parse(process.env.VCAP_APPLICATION);
  applicationRoute = vcapApplications.application_uris[0];
  console.log("applicationRoute=" + applicationRoute);
}else{
    applicationRoute= "localhost";
};

module.exports = {
  "google-login": {
    provider: "google",
    module: "passport-google-oauth2",
    strategy: "OAuth2Strategy",
    clientID: process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
    callbackURL: "https://" + applicationRoute + "/auth/google/callback",
    authPath: "/auth/google",
    callbackPath: "/auth/google/callback",
    successRedirect: "/",
    failureRedirect: "/login",
    scope: ["email", "profile"],
    failureFlash: true
  }
};
