'use strict';

module.exports = function(message) {
  const debug = require('debug')('irserver:message');
  const CommonError = require('../../lib/error');
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
    try {
      payload = JSON.parse(payload) || {};
    } catch (e) {
      debug(`cloud not parse register message payload ${payload}`);
      return;
    }
    const messageId = payload.messageId;
    const irData = payload.irData;
    // 引数オブジェクトのチェック
    if (!messageId) {
      debug('{{payload.messageId}} is required object');
      return;
    }
    if (!irData) {
      debug('{{payload.irData}} is required object');
      return;
    }

    const messageData = {status: 'ready', data: irData};
    message.update({id: messageId}, messageData, (err) => {
      if (err) {
        debug(`message [${messageId}] clould not update: ${JSON.stringify(messageData)}`);
      } else {
        debug(`message [${messageId}] updated: ${JSON.stringify(messageData)}`);
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
      if (err || !result) {
        debug(`no message found [${messageId}]`);
        return cb(CommonError.NotFoundError);
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
        result = result || {};
        if (err || !result.status) {
          debug(`not found message [${messageId}].`);
          debug(`...skip change status ${beforeStatus} => ${afterStatus}`);
          return;
        }

        // statusが変更されている場合、処理をスキップする
        if (result.status !== beforeStatus) {
          debug(`message [${messageId}] status changed to ${result.status}.`);
          debug(`...skip change status ${beforeStatus} => ${afterStatus}`);
          return;
        }

        // statusをロールバックする
        const messageData = {status: afterStatus};
        message.update({id: messageId}, messageData, (err) => {
          if (err) {
            debug(`message [${messageId}] status cloud not change: ${beforeStatus} => ${afterStatus}`);
            return;
          } else {
            debug(`message [${messageId}] is changed: ${beforeStatus} => ${afterStatus}`);
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
        result = result || {};
        if (err || !result) {
          // メッセージが見つからなかった場合
          debug(`not found massage [${messageId}]`);
          return next(CommonError.NotFoundError);
        }

        const currentStatus = result.status;
        // 現在のstatusがreceivingである場合、重複実行となるためエラーとする
        if (currentStatus === 'receiving') {
          debug(`in receiving, not allowed receive message: ${messageId}`);
          const err = CommonError.BadRequestError;
          err.detail = 'parallel execution is not allowed';
          return next(err);
        }

        // デバイスを赤外線リモコン受信待ちにする
        device.receiveMessage(result, (err) => {
          if (err) return next(err);

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
