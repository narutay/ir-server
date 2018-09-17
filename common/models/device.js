'use strict';

module.exports = function(device) {
  const debug = require('debug')('irserver:device');
  const CommonError = require('../../lib/error');
  // Watson IoTの共有クライアント
  const iotClient = require('../../lib/iot-client');

  /**
   * デバイスから受信したステータスデータをDBに登録する関数。
   *
   * @param {String} deviceId 受信デバイスのID
   * @param {Object} payload 受信したイベントのペイロード（JSONデータ）
   */
  device.updateDeviceStatus = function(deviceSerial, payload) {
    const obj = JSON.parse(payload);
    const deviceStatus = obj.Action;
    device.find({where: {serial: deviceSerial}}, (err, results) => {
      results = results || [];
      results.forEach((result) => {
        const deviceId = result.id;
        device.update({id: deviceId}, {status: deviceStatus}, (err) => {
          if (err) {
            debug(`device [${deviceId}] status update failed: ${deviceStatus}`);
          } else {
            debug(`device [${deviceId}] status updated: ${deviceStatus}`);
          }
        });
      });
    });
  };

  /**
   * デバイスが接続状態かチェックする関数。
   *
   * @param {String} deviceId 受信デバイスのID
   * @callback {Function} cb
   * @param {Error} err Error object
   */
  device.isConnected = function(deviceId, cb) {
    // deviceIDで検索しstatusのみを抽出する
    device.findById(deviceId, (err, result) => {
      result = result || {};
      if (err || !result.status) {
        debug(`clould not get device [${deviceId}] status`);
        return cb(CommonError.InternalServerError);
      }

      const deviceStatus = result.status;
      if (deviceStatus === 'Connect') {
        return cb(null, result);
      } else {
        debug(`device is not connected. current status: ${deviceStatus}`);
        return cb(CommonError.ServiceUnavailableError);
      }
    });
  };

  /**
   * デバイスから赤外線を送信する関数
   * オフラインの場合送信しない
   *
   * @param {String} id ユーザID
   * @param {Object} message 赤外線データのメッセージデータオブジェクト
   * @callback {Function} cb
   */
  device.sendMessage = function(message, cb) {
    message = message || {};
    const irData = message.data;
    const deviceId = message.deviceId;
    // 引数オブジェクトのチェック
    if (!irData) {
      debug('{{message.data}} is required object');
      return cb(CommonError.BadRequestError);
    }
    if (!deviceId) {
      debug('{{message.deviceId}} is required object');
      return cb(CommonError.BadRequestError);
    }

    // デバイスがオンラインか確認
    device.isConnected(deviceId, (err, deviceResult) => {
      if (err) return cb(err);

      const deviceSerial = deviceResult.serial;

      // デバイスに赤外線データを送信する
      iotClient.sendMessage(deviceSerial, irData, (err) => {
        if (err) {
          // 赤外線の送信に失敗した場合
          debug(`failed send massage: ${JSON.stringify({deviceSerial: deviceSerial, irData: irData})}`);
          return cb(CommonError.InternalServerError);
        } else {
          return cb(null, message);
        }
      });
    });
  };

  /**
   * デバイスを赤外線リモコン受信待ちにする関数。
   * デバイスは10秒間の待機中に有効なリモコンデータを受信した場合、
   * 指定されたmessageIdにデータを登録する。
   * オフラインの場合実施しない。
   *
   * @param {String} messageId 登録対象のメッセージオブジェクト
   * @callback {Function} cb
   * @param {Error} err Error object
   */
  device.receiveMessage = function(message, cb) {
    message = message || {};
    const messageId = message.id;
    const deviceId = message.deviceId;
    // 引数オブジェクトのチェック
    if (!messageId) {
      debug('{{message.id}} is required object');
      return cb(CommonError.BadRequestError);
    }
    if (!deviceId) {
      debug('{{message.deviceId}} is required object');
      return cb(CommonError.BadRequestError);
    }

    // デバイスがオンラインか確認
    device.isConnected(deviceId, (err, deviceResult) => {
      if (err) return cb(err);

      // デバイスに赤外線データを送信する
      const deviceSerial = deviceResult.serial;
      iotClient.receiveMessage(deviceSerial, messageId, (err) => {
        if (err) {
          // コマンドの送信に失敗した場合
          debug(`could not send message ${JSON.stringify({deviceSerial: deviceSerial, messageId: messageId})}`);
          return cb(CommonError.InternalServerError);
        } else {
          return cb();
        }
      });
    });
  };

  /**
   * 複数のメッセージを送信する関数
   *
   * @param {object} messages 赤外線メッセージのリスト
   * @callback {Function} cb
   * @param {Error} err Error object
   * @param {Allay} resultMessages 送信に成功したメッセージのリスト
   */
  device.sendAllMessage = function(messages, cb) {
    const resultMessages = [];
    let itemsProcessed = 0;
    messages.forEach((message, index, array) => {
      device.sendMessage(message, (err, result) => {
        itemsProcessed++;
        if (err) {
          debug(`could not send message ${message.messageId}`);
        } else {
          resultMessages.push(result);
        }
        // すべての処理完了後に結果を返却する
        if (itemsProcessed === array.length) {
          if (resultMessages.length === 0) {
            // 一つも成功しなかった場合
            debug('none of the messages sent');
            return cb(CommonError.InternalServerError);
          } else {
            // 1つ以上成功した場合、成功したメッセージのリストを返却
            return cb(null, resultMessages);
          }
        }
      });
    });
  };

  // Device 削除前にデバイスに関連するMessageをすべて削除する
  device.observe('before delete', (ctx, next) => {
    const id = ctx.where.id;
    const messageModel = ctx.Model.app.models.message;
    messageModel.destroyAll({deviceId: id}, (err) => {
      if (err) {
        return next(err);
      }
      debug(`all massages are deleted in device [${id}]`);
    });
    next();
  });
};
