'use strict';

module.exports = function(app) {
  const debug = require('debug')('irserver:login');

  // Flash messages for passport
  const flash = require('express-flash');
  app.use(flash());

  const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

  app.get('/', ensureLoggedIn('/login'), (req, res, next) => {
    if (!req.accessToken.id) {
      return next({message: 'Authorization Required', statusCode: 401});
    }
    debug('Found accessToken: %s', req.accessToken.id);

    const messageClassDisplayName = app.get('messageClassDisplayName');

    res.render('pages/index', {
      messageClassDisplayName: messageClassDisplayName,
      user: req.user,
      url: req.url,
    });
  });

  app.get('/login', (req, res, next) => {
    res.render('pages/login', {
      user: req.user,
      url: req.url,
    });
  });

  app.get('/logout', (req, res, next) => {
    req.logout();
    res.redirect('/');
  });
};
