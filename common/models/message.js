'use strict';

module.exports = function(message) {
  const debug = require('debug')('irserver:message');
  const changeStatusTimeout = 10 * 1000; // 10sec

  // statusが initialized, receiving, readyのいずれかであるかチェック
  const allowedStatusEnum = ['initialized', 'receiving', 'ready'];
  message.validatesInclusionOf('status', {
    in: allowedStatusEnum,
    message: `status is allowed only ${allowedStatusEnum}`,
  });

  // classが予め定義されているクラスの一覧に含まれているか確認
  const classDN = require('../../lib/message-class.json');
  const allowedClassEnum = Object.keys(classDN);
  message.validatesInclusionOf('class', {
    in: allowedClassEnum,
    message: 'class is not allowed',
  });

  /**
   * デバイスから受信した赤外線データをDBに登録する関数。
   *
   * @param {String} deviceId 受信デバイスのID
   * @param {Object} payload 受信したイベントのペイロード（JSONデータ）
   */
  message.registerMessage = function(deviceId, payload) {
    const obj = JSON.parse(payload);
    const messageId = obj.messageId;
    const data = obj.irData;

    const messageData = {status: 'ready', data: data};
    message.update({id: messageId}, messageData, (err) => {
      if (err) {
        debug(`Message [${messageId}] update failed: ${messageData}`);
      } else {
        debug(`Message [${messageId}] updated: ${messageData}`);
      }
    });
  };

  /**
   * メッセージIDからメッセージデータを検索する関数。
   *
   * @param {String} messageId 赤外線データのメッセージID
   * @callback {Function} cb
   * @param {Error} err Error object
   */
  message.findMessage = function(messageId, cb) {
    message.findById(messageId, (err, result) => {
      if (err || result === null) {
        debug(`failed find message [${messageId}]`);
        return cb(err);
      } else {
        return cb(null, result);
      }
    });
  };

  /**
   * メッセージの状態を${changeStatusTimeout}秒後に元に戻す関数。
   * initialized:   初期登録状態
   * receiving:     登録待機中
   * ready:         登録済
   *
   * @param {String} id 赤外線データのメッセージID
   * @param {String} beforeStatus 変更前のステータス
   * @param {String} afterStatus 変更後ステータス
   * @param {Number} timeout タイムアウト時間
   */
  function rollbackStatus(messageId, beforeStatus, afterStatus, timeout) {
    setTimeout(() => {
      // ロールバック前に現在のstatusを確認し、receive(変化が無い)でなければ処理をスキップする
      message.findMessage(messageId, (err, result) => {
        if (err || result.status === undefined) {
          debug(`Message [${messageId}] not found.`);
          debug(`skip change status ${beforeStatus} => ${afterStatus} ...`);
          return;
        }

        // statusが変更されている場合、処理をスキップする
        if (result.status !== beforeStatus) {
          debug(`Message [${messageId}] status changed to ${result.status}.`);
          debug(`skip change status ${beforeStatus} => ${afterStatus} ...`);
          return;
        }

        // statusをロールバックする
        const messageData = {status: afterStatus};
        message.update({id: messageId}, messageData, (err) => {
          if (err) {
            debug(`Message [${messageId}] update failed: ${beforeStatus} => ${afterStatus}`);
            return;
          } else {
            debug(`Message [${messageId}] updated: ${beforeStatus} => ${afterStatus}`);
          }
        });
      });
    }, timeout);
  }

  // 更新を伴う処理のデータ更新前の処理
  message.observe('before save', (ctx, next) => {
    // メッセージデータ登録前にユーザID情報を付与する
    if (ctx.isNewInstance && ctx.options.accessToken !== undefined) {
      ctx.instance.userId = ctx.options.accessToken.userId;
    }

    // 更新処理かつstatusをreceivingに更新する場合
    if (ctx.isNewInstance === undefined && ctx.data.status === 'receiving') {
      const device = ctx.Model.app.models.device;
      const messageId = ctx.where.id;
      message.findMessage(messageId, (err, result) => {
        if (err || result === undefined) {
          // メッセージが見つからなかった場合
          debug(`failure find massage id: ${messageId}`);
          const err = new Error();
          err.statusCode = 500;
          return next(err);
        }
        const currentStatus = result.status;

        // 現在のstatusがreceivingである場合、重複実行となるためエラーとする
        if (currentStatus === 'receiving') {
          debug(`failure find massage id: ${messageId}`);
          const err = new Error({message: 'parallel execution is not allowed'});
          err.statusCode = 400;
          return next(err);
        }

        // デバイスを赤外線リモコン受信待ちにする
        device.receiveMessage(result, (err) => {
          if (err) {
            if (err.statusCode === 503) {
              // デバイスがオフラインの場合
              const err = new Error();
              err.statusCode = 503;
              return next(err);
            } else {
              //  それ以外の場合
              const err = new Error();
              err.statusCode = 500;
              return next(err);
            }
          }

          // 一定時間立っても登録されなかった場合、statusをreceivingから元に戻す
          rollbackStatus(messageId, 'receiving', currentStatus, changeStatusTimeout);

          // 処理は継続
          return next();
        });
      });
    } else {
      return next();
    }
  });
};
