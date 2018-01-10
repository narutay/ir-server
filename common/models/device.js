'use strict';

module.exports = function(device) {
  // Device 削除前にデバイスに関連するMessageをすべて削除する
  device.observe('before delete', (ctx, next) => {
    const id = ctx.where.id;
    const messageModel = ctx.Model.app.models.message;
    messageModel.destroyAll({deviceId: id}, (err, info) => {
      if (err) throw err;
      console.log(info);
    });
    next();
  });
};
