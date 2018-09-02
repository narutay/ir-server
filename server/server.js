'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');
const app = module.exports = loopback();

// Setup the view engine (pug)
const path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// boot scripts mount components like REST API
boot(app, __dirname);

// The access token is only available after boot
app.middleware('auth', loopback.token({
  model: app.models.accessToken,
  currentUserLiteral: 'me',
}));

app.start = function() {
  // start the web server
  return app.listen(() => {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
