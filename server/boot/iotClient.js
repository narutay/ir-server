'use strict';

module.exports = function(app) {
  const debug = require('debug')('irserver:iot');
  const deviceType = 'edison';

  // ibmiotfのアプリケーションクライアントを生成して接続
  const Client = require('ibmiotf');
  const iotCredentials = app.get('iotCredentials');
  let appClient = null;
  if (iotCredentials && iotCredentials.org) {
    const appClientConfig = {
      'org': iotCredentials.org,
      'id': iotCredentials.id,
      'auth-key': iotCredentials.apiKey,
      'auth-token': iotCredentials.apiToken,
      'type': 'shared',
    };
    appClient = new Client.IotfApplication(appClientConfig);
    appClient.connect();

    // デバイスからのregisterイベントをサブスクライブする
    appClient.on('connect', () => {
      debug('iot Client connected.');
      appClient.subscribeToDeviceEvents(deviceType, '+', 'register');
    });

    // エラー時にログを出力する
    appClient.on('error', (err) => {
      debug(`appClient Error : ${err}`);
    });

    // 赤外線メッセージ受信時にデータを登録する
    appClient.on('deviceEvent', (
        deviceType, deviceId, eventType, format, payload) => {
      debug(`Device Event from :: ${deviceType} : ${deviceId}`);
      debug(`Event ${eventType} with payload : ${payload}`);
      const messageModel = app.models.message;
      const messageData = {
        deviceId: deviceId,
        name: JSON.parse(payload).name,
        data: JSON.parse(payload).ir_data,
      };
      messageModel.create(messageData, (err) => {
        if (err) {
          debug(`Message create failed: ${messageData.name}`);
        } else {
          debug(`Message created: ${messageData.name}`);
        }
      });
    });
  } else {
    // ibmiotfの接続情報がない場合nullを返却する
    debug('iotCredentials is not configured. attach null appClient');
  }
  return {
    appClient: appClient,
  };
};
