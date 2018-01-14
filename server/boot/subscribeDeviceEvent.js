'use strict';

module.exports = function(app) {
  const debug = require('debug')('irserver:iot');
  // subscribeMessage
  const Client = require('ibmiotf');
  const appClientConfig = {
    'org': app.get('iotCredentials').org,
    'id': app.get('iotCredentials').iotCredentialsIdentifier,
    'auth-key': app.get('iotCredentials').apiKey,
    'auth-token': app.get('iotCredentials').apiToken,
  };
  const appClient = new Client.IotfApplication(appClientConfig);
  appClient.connect();

  // デバイスからのregisterイベントをサブスクライブする
  appClient.on('connect', () => {
    appClient.subscribeToDeviceEvents('edison', '+', 'register');
  });

  // デバイスからのイベントを受信した時の処理
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
};
