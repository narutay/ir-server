'use strict';

module.exports = function(app) {
  const debug = require('debug')('irserver:iot');
  const deviceType = 'edison';

  const iotAppClient = new Object();
  app.set('iotAppClient', iotAppClient);

  iotAppClient.client = null;
  iotAppClient.deviceType = 'edison';
  iotAppClient.qos = 0;
  iotAppClient.deviceModel = app.models.device;
  iotAppClient.connect = function(deviceId, cb) {
    if (this.client === null) {
      debug('appClient is not attached');
      const err = new Error();
      err.statusCode = 500;
      return cb(err);
    }

    if (!this.client.isConnected) {
      debug('appClient is not connected');
      const err = new Error();
      err.statusCode = 500;
      return cb(err);
    }

    const findFields = {
      status: true,
    };
    this.deviceModel.findById(deviceId, {fields: findFields}, (err, result) => {
      if (err || result === null || result.status === undefined) {
        debug(`failed get device status [${deviceId}]`);
        const err = new Error();
        err.statusCode = 500;
        return cb(err);
      }

      const deviceStatus = result.status;
      if (deviceStatus === 'Connect') {
        return cb(null, this.client);
      } else {
        debug(`device is not connected. current status: ${deviceStatus}`);
        const err = new Error();
        err.statusCode = 503;
        return cb(err);
      }
    });
  };

  iotAppClient.publishToDevice = function(deviceId, topic, data, cb) {
    this.connect(deviceId, (err, client) => {
      if (err) {
        return cb(err);
      }
      const publishData = data;
      const publishDataStr = JSON.stringify(data);
      client.publishDeviceCommand(
        this.deviceType,
        deviceId,
        topic,
        'json',
        publishData,
        this.qos,
        (err) => {
          if (err) {
            debug(`failed to Publish ${deviceId} data: ${publishDataStr} error: ${err}`);
            const err = new Error();
            err.statusCode = 503;
            return cb(err);
          } else {
            debug(`Published to ${deviceId} data: ${publishDataStr}`);
            return cb();
          }
        }
      );
    });
  };

  // ibmiotfのアプリケーションクライアントを生成して接続
  const Client = require('ibmiotf');
  const iotCredentials = app.get('iotCredentials');
  if (iotCredentials && iotCredentials.org) {
    const appClientConfig = {
      'org': iotCredentials.org,
      'id': iotCredentials.id,
      'auth-key': iotCredentials.apiKey,
      'auth-token': iotCredentials.apiToken,
    };
    const appClient = new Client.IotfApplication(appClientConfig);

    iotAppClient.client = appClient;

    appClient.connect();

    // デバイスからのregisterイベントをサブスクライブする
    appClient.on('connect', () => {
      debug(`appClient connected with config ${appClientConfig}.`);
      appClient.subscribeToDeviceEvents(deviceType, '+', 'register');
      debug(`subscribing Device type [${deviceType}].`);
      appClient.subscribeToDeviceStatus(deviceType);
      debug(`subscribing Device status [${deviceType}].`);
    });

    // エラー時にログを出力する
    appClient.on('error', (err) => {
      debug(`appClient Error: ${err}`);
    });

    // 赤外線メッセージ受信時にデータを登録する
    appClient.on('deviceEvent', (
        deviceType, deviceId, eventType, format, payload) => {
      debug(`Event [${eventType}] from [${deviceType}/${deviceId} payload: ${payload}`);
      const obj = JSON.parse(payload);
      const data = obj.irData;
      const messageId = obj.messageId;

      const messageModel = app.models.message;
      const messageData = {
        status: 'ready',
        data: data,
      };
      messageModel.update(
        {id: messageId},
        messageData,
        (err) => {
          if (err) {
            debug(`Message [${messageId}] update failed: ${messageData}`);
          } else {
            debug(`Message [${messageId}] updated: ${messageData}`);
          }
        }
      );
    });

    appClient.on('deviceStatus', (deviceType, deviceId, payload, topic) => {
      debug(`Status from [${deviceType}/${deviceId}]: ${payload}`);
      const obj = JSON.parse(payload);
      const deviceStatus = obj.Action;

      const deviceModel = app.models.device;
      deviceModel.update(
        {id: deviceId},
        {status: deviceStatus},
        (err) => {
          if (err) {
            debug(`Device [${deviceId}] status update failed: ${deviceStatus}`);
          } else {
            debug(`Device [${deviceId}] status updated: ${deviceStatus}`);
          }
        }
      );
    });
  } else {
    // ibmiotfの接続情報がない場合nullを返却する
    debug('iotCredentials is not configured. attach null appClient');
  }
};
