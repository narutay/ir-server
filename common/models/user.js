'use strict';

const request = require('request');

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

  user.send = function(id, nk, data, cb) {
    const app = user.app;
    const iotUrl = `https://${app.get('iotCredentials').mqtt_host}:${app.get('iotCredentials').mqtt_s_port}`;
    const iotKey = app.get('iotCredentials').apiKey;
    const iotToken = app.get('iotCredentials').apiToken;
    const tokenBase64 = Buffer.from(`${iotKey}:${iotToken}`).toString('base64');
    const authHeader = `Basic ${tokenBase64}`;
    const postUrl = `${iotUrl}` +
      `/api/v0002/application/types/edison/devices/${nk}/commands/send`;

    const messageData = data.data;
    const postData = {
      'ir_data': messageData,
    };
    const postDataStr = JSON.stringify(postData);
    debug(`Publish data: ${postDataStr}`);

    const options = {
      url: postUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: postDataStr,
    };

    request.post(options, (err, response, body) => {
      if (err) {
        debug('Publish is failed');
        const newErr = new Error('Send IR message is failed');
        newErr.statusCode = 500;
        cb(newErr);
      } else {
        debug('Publish is Success');
        debug(`Publish Response code: ${response.statusCode}`);
        debug(`Publish Response body: ${body}`);
        const result = {
          deviceId: nk,
          messageData: messageData,
        };
        cb(null, result);
      }
    });
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
    const iotUrl = `https://${app.get('iotCredentials').mqtt_host}:${app.get('iotCredentials').mqtt_s_port}`;
    const iotKey = app.get('iotCredentials').apiKey;
    const iotToken = app.get('iotCredentials').apiToken;
    const tokenBase64 = Buffer.from(`${iotKey}:${iotToken}`).toString('base64');
    const authHeader = `Basic ${tokenBase64}`;
    const postUrl = `${iotUrl}` +
      `/api/v0002/application/types/edison/devices/${nk}/commands/read`;

    const postData = {};
    const postDataStr = JSON.stringify(postData);
    debug(`Publish data: ${postDataStr}`);

    const options = {
      url: postUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: postDataStr,
    };

    request.post(options, (err, response, body) => {
      if (err) {
        debug('Publish is failed');
        const newErr = new Error('Send IR message is failed');
        newErr.statusCode = 500;
        cb(newErr);
      } else {
        debug('Publish is Success');
        debug(`Publish Response code: ${response.statusCode}`);
        debug(`Publish Response body: ${body}`);
        debug('waiting for register massage.');

        const result = {
          deviceId: nk,
        };
        cb(null, result);
      }
    });
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
