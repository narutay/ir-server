'use strict';

module.exports = function(user) {
  const debug = require('debug')('irserver:user');
  const CommonError = require('../../lib/error');
  // Watson STTのクライアント
  const sttClient = require('../../lib/stt-client');
  // Watson NLCのクライアント
  const nlcClient = require('../../lib/nlc-client');

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

  /**
   * デバイスから赤外線を送信するAPI
   *
   * @param {String} id ユーザID
   * @param {String} deviceId 赤外線を送信するデバイスのID
   * @param {String} messageId 赤外線データのメッセージIDの
   * @callback {Function} next
   */
  user.send = function(id, deviceId, messageId, next) {
    const app = user.app;
    const message = app.models.message;
    const device = app.models.device;

    // messageIdに登録されている赤外線データを検索する
    message.findMessage(messageId, (err, message) =>{
      if (err || !message) {
        // 対象の赤外線データが存在しない場合
        return next(CommonError.NotFoundError);
      }

      // 赤外線メッセージをデバイスから送信
      device.sendMessage(message, (err, result) => {
        if (err) {
          return next(err);
        } else {
          debug(`success send message ${JSON.stringify(result)}`);
          return next();
        }
      });
    });
  };

  /**
   * user.send()のリモートメソッド
   */
  user.remoteMethod('send', {
    accepts: [
      {arg: 'id', type: 'string'},
      {arg: 'nk', type: 'string'},
      {arg: 'messageId', type: 'string', required: true},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/:id/devices/:nk/send', verb: 'post'},
  });

  /**
   * 自然言語（話言葉）などから対象の分類を抽出し、最適なな赤外線を送信するAPI
   *
   * @param {String} id ユーザID
   * @param {String} text 自然言語をテキスト化したもの。どのような文章でもよい。
   * @param {boolean} dry trueの場合候補のメッセージ抽出のみし、実際にデバイスから送信はしない
   * @callback {Function} next
   */
  user.suggest = function(id, text, dry, next) {
    const app = user.app;
    const message = app.models.message;
    const nlcEnabled = app.get('nlcEnabled');
    if (!nlcEnabled) {
      debug('NLC is disabled');
      return next(CommonError.NotImplementedError);
    }
    const nlcCredentials = app.get('nlcCredentials');
    const classifierId = app.get('nlcClassifierId');
    const classifier = new nlcClient(nlcCredentials, classifierId);
    const device = app.models.device;

    classifier.classify(text, (err, messageClass) => {
      if (err || messageClass === undefined) {
        if (err.statusCode === 404) {
          // 信頼率が高いクラスが見つからなかった場合Not Found
          debug(`not found class. text: ${text}`);
          return next(CommonError.NotFoundError);
        } else {
          // それ以外は500
          debug(`failed classfy. text: ${text}`);
          return next(CommonError.InternalServerError);
        }
      }

      // 登録されているメッセージから登録されているクラス名で検索する
      // データが未登録のものは除外する
      const filter = {
        and: [
          {userId: id},
          {class: messageClass},
          {data: {'neq': null}},
        ],
      };
      message.find({where: filter}, (err, result) => {
        result = result || {};
        // 検索が失敗した場合
        if (err) {
          return next(CommonError.InternalServerError);
        }

        // 検索に成功したが、該当のメッセージが存在しなかった場合Not Found
        if (result.length === 0) {
          debug(`no message found. class: [${messageClass}]`);
          next(CommonError.NotFoundError);
        }

        if (!dry) {
          // dryオプションが無効な場合、
          // 検索結果のすべての赤外線メッセージをデバイスから送信する
          device.sendAllMessage(result, (err, messages) => {
            if (err) {
              // すべての送信に失敗した場合
              return next(err);
            } else {
              // 送信に成功した場合、成功したメッセージの一覧を返却する
              return next(null, messages);
            }
          });
        } else {
          // dryオプションが有効な場合、検索結果のみを返却する
          return next(null, result);
        }
      });
    });
  };

  /**
   * user.suggest()のリモートメソッド
   */
  user.remoteMethod('suggest', {
    accepts: [
      {arg: 'id', type: 'string'},
      {arg: 'text', type: 'string', required: true},
      {arg: 'dry', type: 'boolean', required: false, default: false},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/:id/suggest', verb: 'post'},
  });

  /**
   * Watson STTのアクセストークン発行API。
   * 中継すると遅延が大きいことから、クライアントから直接Watson APIを実行する。
   * Watson STTのクレデンシャルは配布できないため、
   * 短期間利用できるトークンをクライアントごとに配布する。
   *
   * @param {String} id ユーザID
   * @callback {Function} next
   */
  user.suggestToken = function(id, next) {
    const app = user.app;
    const nlcEnabled = app.get('nlcEnabled');
    if (!nlcEnabled) {
      debug('NLC is disabled');
      return next(CommonError.NotImplementedError);
    }
    const sttCredentials = app.get('sttCredentials');
    const client = new sttClient(sttCredentials);
    client.getSttToken((err, token) => {
      if (err) {
        return next(CommonError.InternalServerError);
      } else {
        return next(null, token);
      }
    });
  };

  /**
   * user.suggestToken()のリモートメソッド
   */
  user.remoteMethod('suggestToken', {
    accepts: [
      {arg: 'id', type: 'string'},
    ],
    returns: {type: 'object', root: true},
    http: {path: '/:id/suggestToken', verb: 'get'},
  });
};
