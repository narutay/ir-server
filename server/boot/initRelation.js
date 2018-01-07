'use strict';

module.exports = function(app) {
  // Enable nested endpoints like /api/user/:id/devices/:id/messages/:id
  app.models.user.nestRemoting('devices');
  app.models.device.nestRemoting('messages');
}
