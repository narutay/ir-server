'use strict';

module.exports = function(app) {
  const debug = require('debug')('irserver:iot');

  // Watson IoTの共有クライアント
  const client = require('../../lib/iot-client');
  const iotCredentials = app.get('iotCredentials');
  const qos = 0;

  if (iotCredentials) {
    // Watson IoT クライアントの初期化とコネクションの確立
    client.init(qos, iotCredentials, (err) =>{
      if (err) {
        debug(`failed initialize Watson IoT Client err: ${err}`);
      }
    });

    // デバイスからの赤外線データ登録イベントを契機に、メッセージのデータ更新をする
    client.subscribeEvent('register', app.models.message.registerMessage);
    // デバイスの状態変更イベントを契機に、デバイスのステータスを更新する
    client.subscribeStatus(app.models.device.updateDeviceStatus);
  } else {
    debug('can not found iotCredential config. disabled IoT Client');
  }
};
