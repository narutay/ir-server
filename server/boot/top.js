'use strict';

module.exports = function(app) {
  const debug = require('debug')('irserver:top');

  app.get('/', (req, res, next) => {
    const messageClassDisplayName = app.get('messageClassDisplayName');
    res.render('pages/index', {
      messageClassDisplayName: messageClassDisplayName,
      user: req.user,
      url: req.url,
    });
  });
};
