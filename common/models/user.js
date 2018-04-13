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

  const deviceType = 'edison';

  user.send = function(id, nk, data, cb) {
    const app = user.app;
    const appClient = require('../../server/boot/iotClient')(app).appClient;

    const messageData = data.data;
    const publishData = JSON.stringify({
      'ir_data': messageData,
    });
    debug(`command read Publish data: ${publishData}`);
    appClient.publishDeviceCommand(deviceType, nk, 'send', 'json', publishData);
    const result = {
      deviceId: nk,
      messageData: publishData,
    };
    cb(null, result);
  };

  user.remoteMethod('send', {
    accepts: [
      {arg: 'id', type: 'string'},
      {arg: 'nk', type: 'string'},
      {arg: 'data',
        type: 'object',
        http: {source: 'body'}},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/:id/devices/:nk/send', verb: 'post'},
  });

  user.recieve = function(id, nk, cb) {
    const app = user.app;
    const appClient = require('../../server/boot/iotClient')(app).appClient;

    const publishData = JSON.stringify({});
    debug(`command send Publish data: ${publishData}`);
    appClient.publishDeviceCommand(deviceType, nk, 'read', 'json', publishData);
    cb(null);
  };

  user.remoteMethod('recieve', {
    accepts: [
      {arg: 'id', type: 'string'},
      {arg: 'nk', type: 'string'},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/:id/devices/:nk/recieve', verb: 'post'},
  });
};
