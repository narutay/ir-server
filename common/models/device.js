'use strict';

var request = require('request');

module.exports = function(device) {
  var debug = require('debug')('irserver:device')
  var _ = require('lodash');

  //device.disableRemoteMethodByName('create');
  //device.disableRemoteMethodByName('count');
  //device.disableRemoteMethodByName('find');
  //device.disableRemoteMethodByName('findById');
  //device.disableRemoteMethodByName('deleteById');
  //device.disableRemoteMethodByName('patchAttributes');
  //device.disableRemoteMethodByName('replaceById');

  device.disableRemoteMethodByName('confirm');
  device.disableRemoteMethodByName('createChangeStream');
  device.disableRemoteMethodByName('exists');
  device.disableRemoteMethodByName('patchOrCreate');
  device.disableRemoteMethodByName('replaceById');
  device.disableRemoteMethodByName('replaceOrCreate');
  device.disableRemoteMethodByName('resetPassword');
  device.disableRemoteMethodByName('upsert');
  device.disableRemoteMethodByName('upsertWithWhere');
  device.disableRemoteMethodByName('findOne');
  //device.disableRemoteMethodByName('updateAll');
  //device.disableRemoteMethodByName('updateAttributes');

  device.disableRemoteMethodByName('prototype.__destroyById__events');
  device.disableRemoteMethodByName('prototype.__updateById__events');
  device.disableRemoteMethodByName('prototype.__create__events');
  device.disableRemoteMethodByName('prototype.__delete__events');

  //デバイス作成時にリクエスト時のaccessTokenに紐づくuserIdを
  //ownerIdとして付与する
  device.beforeRemote('create', function(ctx, model, next) {
    var req = ctx.req;
    req.body.ownerId = req.accessToken.userId;
    next();
  });

  //デバイスのアクセス時はリクエスト時のaccessTokenに紐づくuserIdで
  //フィルターをかける
  device.observe('access', function limitToOwner(ctx, next) {
    //where区が定義されていない場合初期化する
    if( _.isUndefined( ctx.query.where ) ){
      ctx.query.where = {};
    }

    //Model APIから呼ばれる場合はコンテキストがないため処理をしない
    if( _.isUndefined( ctx.options.accessToken ) ){
      debug("device model can not access by Model API, skip ...");
      //return next({message: 'Internal Server Error', statusCode: 500});
    } else {
      //where区にユーザIDによるフィルタを追加する
      var accessToken = ctx.options.accessToken;
      debug('Found userID: %s', accessToken.userId) 
      ctx.query.where = {
        and: [ ctx.query.where, { ownerId: accessToken.userId } ]
      };
    }
    next();
  });

  function sendMessageToDevice(deviceId, messageData){
    var app = device.app;
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
        console.log(body);
      }
    });
  }

  device.send = function(id, data, cb) {
    var messageData = data.data;
    sendMessageToDevice(id, messageData);
    var result = {
      deviceId: id,
      messageData: messageData
    };
    cb(null, result);
  }

  device.remoteMethod('send', {
    accepts: [
      { arg: 'id', type: 'string' },
      { arg: 'data',
        type: 'object',
        http: { source: 'body' }}
    ],
    http: {path: '/:id/send', verb: 'post'},
    returns: {type: 'array', root: true}
  });
};
