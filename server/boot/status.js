'use strict';

module.exports = function(app) {
  // Install a `/` route that returns server status
  const router = app.loopback.Router();
  router.get('/status', app.loopback.status());
  app.use(router);
};
