'use strict';

var request = require('request');

module.exports = function(user) {
  var debug = require('debug')('irserver:user')
  //user.disableRemoteMethodByName('create');
  user.disableRemoteMethodByName('count');
  //user.disableRemoteMethodByName('find');
  //user.disableRemoteMethodByName('findById');
  //user.disableRemoteMethodByName('deleteById');
  user.disableRemoteMethodByName('patchAttributes');
  //user.disableRemoteMethodByName('replaceById');

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

  function sendMessageToDevice(deviceId, messageData){
    var app = user.app;
    var iotUrl = app.get('iotUrl');
    var iotKey = app.get('iotKey');
    var iotToken = app.get('iotToken');
    var auth = 'Basic ' + new Buffer(iotKey + ':' + iotToken).toString('base64');
    var postUrl = iotUrl + '/api/v0002/application/types/edison/devices/' + deviceId + '/commands/send'

    var postData = {
      "ir_data": messageData
    };
    
    let postDataStr = JSON.stringify(postData);
    let options = {
        url: postUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify(postData)
    };

    request.post(options, function(err, response, body){
      if(err){
        return next({message: 'Internal Server Error', statusCode: 500});
      }
    });
  }

  user.send = function(id, nk, data, cb) {
    var messageData = data.data;
    sendMessageToDevice(nk, messageData);
    var result = {
      deviceId: nk,
      messageData: messageData
    };
    cb(null, result);
  }

  user.remoteMethod('send', {
    accepts: [
      { arg: 'id', type: 'string' },
      { arg: 'nk', type: 'string' },
      { arg: 'data',
        type: 'object',
        http: { source: 'body' }}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/:id/devices/:nk/send', verb: 'post'}
  });
};
