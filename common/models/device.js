'use strict';

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
  device.disableRemoteMethodByName('updateAll');
  device.disableRemoteMethodByName('updateAttributes');

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
};
