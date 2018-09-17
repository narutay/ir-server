'use strict';

const debug = require('debug')('irserver:iot');

const IoTClient = new Object();

/**
 * Watson IoTのクライアント初期化処理。
 * コネクションを共有するためserver起動時に一度だけ実行する。
 *
 * @param {Number} qos MQTTプロトコルで利用するQOS値
 * @param {Object} credentials Watson IoTのクレデンシャル情報(VCAP_SERVICES)
 * @callback {Function} cb
 * @param {Error} err Error object
 */
IoTClient.init = function(qos, credentials, cb) {
  this.deviceType = 'edison';
  this.qos = qos;
  credentials = credentials || {};

  // Watson IoTのアプリケーションクライアントを生成して接続
  const ibmiotf = require('ibmiotf');
  const appClientConfig = {
    'org': credentials.org,
    'id': credentials.iotCredentialsIdentifier,
    'auth-key': credentials.apiKey,
    'auth-token': credentials.apiToken,
    'type': 'shared',
  };
  this.appClient = new ibmiotf.IotfApplication(appClientConfig);
  this.appClient.connect();

  // Watson IoTへの接続成功後のイベント
  this.appClient.on('connect', () => {
    // 接続成功のログ出力
    const configStr = JSON.stringify(appClientConfig);
    debug(`appClient connected with config ${configStr}.`);

    // すべてのデバイスIDのregisterトピック（赤外線データ受信）イベントをサブスクライブ
    this.appClient.subscribeToDeviceEvents(this.deviceType, '+', 'register');
    debug(`subscribing Device type [${this.deviceType}].`);

    // すべてのデバイスIDの状態変更イベントをサブスクライブ
    this.appClient.subscribeToDeviceStatus(this.deviceType);
    debug(`subscribing Device status [${this.deviceType}].`);

    // 正常時のコールバック
    cb();
  });

  // エラー時にログを出力する
  this.appClient.on('error', (err) => {
    debug(`Failed connect Wwatson IoT Error: ${err}`);

    // 初期化異常時のコールバック
    cb(err);
  });
};

/**
 * デバイスからのイベント待ち受けを登録する関数。
 * 複数回同一のイベントタイプを登録しないこと。
 *
 * @param {String} eventType 待ち受けるイベントタイプ (e.g. register)
 * @callback {Function} cb イベントタイプが一致した場合に実行するコールバック
 * @param {String} deviceSerial 受信デバイスのID
 * @param {Object} payload 受信したイベントのペイロード（データ）
 */
IoTClient.subscribeEvent = function(eventType, cb) {
  this.appClient.on('deviceEvent', (
      deviceType, deviceSerial, receiveEventType, format, payload
    ) => {
    debug(`Event [${eventType}] received from [${deviceType}/${deviceSerial}]`);
    debug(`Event [${eventType}] receive payload: ${payload}`);
    if (eventType === receiveEventType) {
      debug(`mache device ${deviceSerial} event ${eventType}.`);
      cb(deviceSerial, payload);
    }
  });
};

/**
 * デバイスからのステータス変更待ち受けを登録する関数。
 * 複数回同一のイベントタイプを登録しないこと。
 *
 * @callback {Function} cb ステータス変更があった場合に実行するコールバック
 * @param {String} deviceSerial 受信デバイスのID
 * @param {Object} payload 受信したステータスのペイロード（データ）
 */
IoTClient.subscribeStatus = function(cb) {
  this.appClient.on('deviceStatus', (deviceType, deviceSerial, payload) => {
    debug(`status from [${deviceType}:${deviceSerial}]: ${payload}`);
    cb(deviceSerial, payload);
  });
};

/**
 * デバイスの任意のトピックにコマンドを送信するコマンド。
 *
 * @param {String} deviceSerial コマンドを送信したいデバイスのデバイスID
 * @param {String} topic コマンドのトピック（命令の種別）
 * @param {Object} data コマンドのデータ
 * @callback {Function} cb
 * @param {Error} err Error object
 */
IoTClient.command = function(deviceSerial, topic, command, cb) {
  const commandStr = JSON.stringify(command);
  this.appClient.publishDeviceCommand(
    this.deviceType, deviceSerial, topic, 'json',
    command, this.qos, (err) => {
      if (err) {
        debug(`cloud not publish ${deviceSerial} command: ${commandStr} error: ${err}`);
        return cb(err);
      } else {
        debug(`published to ${deviceSerial} command: ${commandStr}`);
        return cb();
      }
    }
  );
};

/**
 * デバイスから赤外線を送信する関数。
 *
 * @param {String} deviceSerial 赤外線を送信するデバイスのID
 * @param {Object} irData 送信する赤外線データ
 * @callback {Function} cb
 * @param {Error} err Error object
 */
IoTClient.sendMessage = function(deviceSerial, irData, cb) {
  const data = JSON.stringify({irData: irData});
  this.command(deviceSerial, 'send', data, (err) => {
    if (err) {
      return cb(err);
    } else {
      return cb();
    }
  });
};

/**
 * デバイスを赤外線リモコン受信待ちにする関数。
 * デバイスは10秒間の待機中に有効なリモコンデータを受信した場合、
 * 指定されたmessageIdにデータを登録する。
 *
 * @param {String} deviceSerial 受信待ちにするデバイスのデバイスID
 * @param {String} messageId 受信後の登録先メッセージID
 * @callback {Function} cb
 * @param {Error} err Error object
 */
IoTClient.receiveMessage = function(deviceSerial, messageId, cb) {
  const data = JSON.stringify({messageId: messageId});
  this.command(deviceSerial, 'read', data, (err) => {
    if (err) {
      return cb(err);
    } else {
      return cb();
    }
  });
};

module.exports = IoTClient;
