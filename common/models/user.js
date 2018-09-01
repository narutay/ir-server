'use strict';

module.exports = function(user) {
  const debug = require('debug')('irserver:user');
  const NaturalLanguageClassifierV1 = require('watson-developer-cloud/natural-language-classifier/v1'); // eslint-disable-line max-len
  const AuthorizationV1 = require('watson-developer-cloud/authorization/v1');

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

  function getClass(text, cb) {
    const minConfidence = 0.5;
    const app = user.app;
    const nlcCredentials = app.get('nlcCredentials');
    const classifierId = app.get('nlcClassifierId');
    const classifier = new NaturalLanguageClassifierV1(nlcCredentials);

    const question = {
      text: text,
      classifier_id: classifierId, // eslint-disable-line camelcase
    };
    debug(`request NLC classify classifierId: [${classifierId}] text: ${text}`);
    classifier.classify(question, (err, response) => {
      if (err) {
        debug(`failed classifierId: [${classifierId}] text: ${text}`);
        const err = new Error();
        err.statusCode = 500;
        cb(err);
      } else {
        const topClass = response.classes[0];
        const confidence = topClass.confidence;
        const className = topClass.class_name;
        if (topClass.confidence < minConfidence) {
          debug(`class [${className}] confidence ${confidence} less than ${minConfidence}`); // eslint-disable-line max-len
          const err = new Error();
          err.statusCode = 404;
          cb(err);
        } else {
          debug(`found class [${className}] confidence: ${confidence}`);
          return cb(null, className);
        }
      }
    });
  }

  function sendAllMessage(messages, cb) {
    const app = user.app;
    const appClient = app.get('iotAppClient');
    let itemsProcessed = 0;
    let publishError = null;
    messages.forEach((message, index, array) => {
      const irData = message.data;
      const deviceId = message.deviceId;
      const data = JSON.stringify({irData: irData});
      appClient.publishToDevice(deviceId, 'send', data, (err) => {
        itemsProcessed++;
        if (err) {
          publishError = err;
        }
        if (itemsProcessed === array.length) {
          if (publishError) {
            cb(err);
          } else {
            return cb(null, messages);
          }
        }
      });
    });
  }

  user.suggest = function(id, text, dry, next) {
    const app = user.app;
    const message = app.models.message;
    getClass(text, (err, messageClass) => {
      if (err) {
        return next(err);
      }
      const filter = {
        and: [
          {userId: id},
          {class: messageClass},
          {data: {'neq': null}},
        ],
      };
      message.find({where: filter}, (err, result) => {
        if (err) {
          return next(err);
        }
        if (result.length === 0) {
          debug(`no message found hav class [${messageClass}]`);
          const err = new Error();
          err.statusCode = 404;
          next(err);
        }
        if (!dry) {
          sendAllMessage(result, (err, messages) => {
            if (err) {
              return next(err);
            } else {
              return next(null, messages);
            }
          });
        } else {
          return next(null, result);
        }
      });
    });
  };

  user.remoteMethod('suggest', {
    accepts: [
      {arg: 'id', type: 'string'},
      {arg: 'text', type: 'string', required: true},
      {arg: 'dry', type: 'boolean', required: false, default: false},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/:id/suggest', verb: 'post'},
  });

  function getSttToken(cb) {
    const app = user.app;
    const sttCredentials = app.get('sttCredentials');
    const sttUrl = sttCredentials.url;

    const authorization = new AuthorizationV1({
      username: sttCredentials.username,
      password: sttCredentials.password,
      url: 'https://stream.watsonplatform.net/authorization/api'
    });

    authorization.getToken({url: sttUrl}, (err, token) => {
      if (err || !token) {
        debug(`failed get STT Token by use ${sttCredentials.username} err: ${err}`); // eslint-disable-line max-len
        const err = new Error();
        err.statusCode = 500;
        return cb(err);
      } else {
        return cb(null, {token: token});
      }
    });
  }

  user.suggestToken = function(id, next) {
    getSttToken((err, token) => {
      if (err) {
        return next(err);
      } else {
        return next(null, token);
      }
    });
  };

  user.remoteMethod('suggestToken', {
    accepts: [
      {arg: 'id', type: 'string'},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/:id/suggestToken', verb: 'get'},
  });
};
