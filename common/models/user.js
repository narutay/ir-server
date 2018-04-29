'use strict';

module.exports = function(user) {
  const debug = require('debug')('irserver:user');
  // user.disableRemoteMethodByName('create');
  user.disableRemoteMethodByName('count');
  // user.disableRemoteMethodByName('find');
  // user.disableRemoteMethodByName('findById');
  // user.disableRemoteMethodByName('deleteById');
  user.disableRemoteMethodByName('patchAttributes');
  // user.disableRemoteMethodByName('replaceById');

  user.disableRemoteMethodByName('confirm');
  user.disableRemoteMethodByName('createChangeStream');
  user.disableRemoteMethodByName('exists');
  user.disableRemoteMethodByName('patchOrCreate');
  user.disableRemoteMethodByName('replaceById');
  user.disableRemoteMethodByName('replaceOrCreate');
  user.disableRemoteMethodByName('resetPassword');
  user.disableRemoteMethodByName('upsert');
  user.disableRemoteMethodByName('upsertWithWhere');
  user.disableRemoteMethodByName('findOne');
  user.disableRemoteMethodByName('updateAll');
  user.disableRemoteMethodByName('updateAttributes');

  user.disableRemoteMethodByName('prototype.updateAttributes');
  user.disableRemoteMethodByName('prototype.__destroyById__events');
  user.disableRemoteMethodByName('prototype.__updateById__events');
  user.disableRemoteMethodByName('prototype.__create__events');
  user.disableRemoteMethodByName('prototype.__delete__events');

  user.disableRemoteMethodByName('prototype.__count__accessTokens');
  user.disableRemoteMethodByName('prototype.__create__accessTokens');
  user.disableRemoteMethodByName('prototype.__delete__accessTokens');
  user.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
  user.disableRemoteMethodByName('prototype.__findById__accessTokens');
  user.disableRemoteMethodByName('prototype.__get__accessTokens');
  user.disableRemoteMethodByName('prototype.__updateById__accessTokens');

  user.send = function(id, deviceId, messageId, next) {
    const app = user.app;
    const message = app.models.message;
    message.findMessage(messageId, (err, result) =>{
      if (err || result === null) {
        return next(err);
      }

      const appClient = app.get('iotAppClient');
      const irData = result.data;
      const data = JSON.stringify({irData: irData});
      appClient.publishToDevice(deviceId, 'send', data, (err) => {
        if (err) {
          return next(err);
        } else {
          return next();
        }
      });
    });
  };

  user.remoteMethod('send', {
    accepts: [
      {arg: 'id', type: 'string'},
      {arg: 'nk', type: 'string'},
      {arg: 'messageId', type: 'string', required: true},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/:id/devices/:nk/send', verb: 'post'},
  });
};
