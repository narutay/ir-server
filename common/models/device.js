'use strict';

module.exports = function(device) {
  const debug = require('debug')('irserver:device');

  // Device 削除前にデバイスに関連するMessageをすべて削除する
  device.observe('before delete', (ctx, next) => {
    const id = ctx.where.id;
    const messageModel = ctx.Model.app.models.message;
    messageModel.destroyAll({deviceId: id}, (err, info) => {
      if (err) {
        return next(err);
      }
      debug(`all massage deleted in device [${id}]: ${info}`);
    });
    next();
  });
};
