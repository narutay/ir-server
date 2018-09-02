'use strict';

module.exports = function(device) {
  const debug = require('debug')('irserver:device');
  // Watson IoTの共有クライアント
  const iotClient = require('../../lib/iot-client');

  /**
   * デバイスから受信したステータスデータをDBに登録する関数。
   *
   * @param {String} deviceId 受信デバイスのID
   * @param {Object} payload 受信したイベントのペイロード（JSONデータ）
   */
  device.updateDeviceStatus = function(deviceId, payload) {
    const obj = JSON.parse(payload);
    const deviceStatus = obj.Action;

    device.update({id: deviceId}, {status: deviceStatus}, (err) => {
      if (err) {
        debug(`Device [${deviceId}] status update failed: ${deviceStatus}`);
      } else {
        debug(`Device [${deviceId}] status updated: ${deviceStatus}`);
      }
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
    device.findById(deviceId, {fields: {status: true}}, (err, result) => {
      if (err || result === null || result.status === undefined) {
        debug(`failed get device status [${deviceId}]`);
        return cb(err);
      }

      const deviceStatus = result.status;
      if (deviceStatus === 'Connect') {
        return cb(null);
      } else {
        debug(`device is not connected. current status: ${deviceStatus}`);
        const err = new Error();
        err.statusCode = 503;
        return cb(err);
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
    let irData = null;
    let deviceId = null;
    try {
      irData = message.data;
      deviceId = message.deviceId;
    } catch (e) {
      debug('can not parse irData object from message object');
      const err = new Error();
      err.statusCode = 500;
      return cb(err);
    }

    // デバイスがオンラインか確認
    device.isConnected(deviceId, (err) => {
      // オンラインでなければエラー
      if (err) {
        const err = new Error();
        err.statusCode = 503;
        return cb(err);
      }
      // デバイスに赤外線データを送信する
      iotClient.sendMessage(deviceId, irData, (err) => {
        if (err) {
          // 赤外線の送信に失敗した場合
          const err = new Error();
          err.statusCode = 500;
          return cb(err);
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
    let messageId = null;
    let deviceId = null;
    try {
      messageId = message.id;
      deviceId = message.deviceId;
    } catch (e) {
      debug('can not parse irData object from message object');
      const err = new Error();
      err.statusCode = 500;
      return cb(err);
    }

    // デバイスがオンラインか確認
    device.isConnected(deviceId, (err) => {
      // オンラインでなければエラー
      if (err) {
        const err = new Error();
        err.statusCode = 503;
        return cb(err);
      }
      // デバイスに赤外線データを送信する
      iotClient.receiveMessage(deviceId, messageId, (err) => {
        if (err) {
          // コマンドの送信に失敗した場合
          const err = new Error();
          err.statusCode = 500;
          return cb(err);
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
          debug(`failed sendMessage ${message.messageId}`);
        } else {
          resultMessages.push(result);
        }
        // すべての処理完了後に結果を返却する
        if (itemsProcessed === array.length) {
          if (resultMessages.length === 0) {
            // 一つも成功しなかった場合
            const err = new Error();
            err.statusCode = 500;
            return cb(err);
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
    messageModel.destroyAll({deviceId: id}, (err, info) => {
      if (err) {
        return next(err);
      }
      debug(`all massage deleted in device [${id}]: ${info}`);
    });
    next();
  });
};
