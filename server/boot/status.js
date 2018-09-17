'use strict';

const status = require('loopback-status');

module.exports = function(app) {
  const Status = new status({
    models: [app.models.user],
  });

  const router = app.loopback.Router();
  router.get('/status', Status.health);
  app.use(router);
};
