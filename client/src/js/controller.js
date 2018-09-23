'use strict';

const Device = require('./device');
const Message = require('./message');
const STTClient = require('./stt-client');
// snackbarにメッセージを表示する
const notification = require('./notification');
const info = notification.info;
const alert = notification.alert;

class Controller {
  /**
   * DeviceのModel と View を初期化
   * View からユーザーのイベントを受け取る
   *
   * @param {Object} element jQueryのエレメント
   * @memberof Controller
   */
  constructor($element) {
    this.devices = new Device.Devices();
    this.deviceView = new Device.DeviceView($element, this.devices);

    // イベント登録=>デバイス追加操作
    $(this.deviceView).on('addDevice', (e, opt) => {
      this.addDevice(opt);
    });

    // イベント登録=>デバイス編集操作
    $(this.deviceView).on('editDevice', (e, opt) => {
      this.editDevice(opt);
    });

    // イベント登録=>デバイス削除操作
    $(this.deviceView).on('deleteDevice', (e, deviceId) => {
      this.deleteDevice(deviceId);
    });

    // イベント登録=>メッセージ追加操作
    $(this.deviceView).on('addMessage', (e, opt) => {
      this.addMessage(opt.deviceId, opt.data);
    });

    // イベント登録=>メッセージ編集操作
    $(this.deviceView).on('editMessage', (e, opt) => {
      this.editMessage(opt.deviceId, opt.messageId, opt.data);
    });

    // イベント登録=>メッセージ削除操作
    $(this.deviceView).on('deleteMessage', (e, opt) => {
      this.deleteMessage(opt.deviceId, opt.messageId);
    });

    // イベント登録=>メッセージ送信操作
    $(this.deviceView).on('sendMessage', (e, opt) => {
      this.sendMessage(opt.deviceId, opt.messageId);
    });

    // イベント登録=>メッセージ受信操作
    $(this.deviceView).on('receiveMessage', (e, opt) => {
      this.receiveMessage(opt.deviceId, opt.messageId);
    });

    // イベント登録=>音声操作
    $(this.deviceView).on('suggest', () => {
      this.voice();
    });

    // 提案機能のトークン取得
    this.sttClient = new STTClient();
    this.sttClient.getSttToken((err) => {
      if (!err) {
        this.deviceView.enableSuggest();
      }
    });

    // デバイスの一覧を取得して描画する
    this.getDeviceList((err, deviceList) => {
      if (err) {
        alert('デバイス一覧の取得に失敗しました');
        return;
      }

      // デバイスが存在しない場合、空のデバイスをロードする
      if (deviceList.length === 0) {
        this.devices.load(deviceList);
        return;
      }

      // メッセージの一覧を取得する
      let itemsProcessed = 0;
      deviceList.forEach((device, index, array) => {
        const deviceId = device.id;
        this.getMessageList(deviceId, (err, messages) => {
          const messagesObj = new Message.Messages(messages);
          deviceList[index].messages = messagesObj;
          // 最後の要素でのアクション
          itemsProcessed++;
          if (itemsProcessed === array.length) {
            // Deviceモデルにデータをロードする
            this.devices.load(deviceList);
          }
        });
      });
    });
  }

  getToken() {
    return localStorage.getItem('id_token');
  }

  /**
   * サーバからDeviceの一覧を取得する
   *
   * @param {callback} cb
   * @param {Error} err Error object
   * @param {Allay} err Device情報のリスト
   * @memberof Controller
   */
  getDeviceList(cb) {
    const token = this.getToken();
    $.ajax({
      type: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      dataType: 'json',
      url: '/api/users/me/devices?filter[order]=name ASC',
      timeout: 10000,
      success: function(deviceList) {
        cb(null, deviceList);
      },
      error: function() {
        const err = new Error();
        cb(err);
      },
    });
  }

  /**
   * デバイスを追加する
   *
   * @param {Object} opt Device情報のオブジェクト
   * @memberof Controller
   */
  addDevice(opt) {
    opt = opt || {};
    const sendUrl = '/api/users/me/devices';
    const token = this.getToken();
    const request = $.ajax({
      url: sendUrl,
      type: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        serial: opt.deviceSerial,
        name: opt.deviceName,
      },
      timeout: 10000,
    });

    request.done((device) => {
      info('デバイスの登録が完了しました');
      // 空のMessageオブジェクトを作成してDeviceオブジェクトに格納
      const messagesObj = new Message.Messages([]);
      device.messages = messagesObj;
      this.devices.push(device);
      return device;
    });

    request.fail(() => {
      alert('デバイスの登録に失敗しました');
      return;
    });
  }

  /**
   * デバイスを編集する
   *
   * @param {Object} opt Device情報のオブジェクト
   * @memberof Controller
   */
  editDevice(opt) {
    opt = opt || {};
    const deviceId = opt.deviceId;
    const url = `/api/users/me/devices/${deviceId}`;
    const token = this.getToken();
    const request = $.ajax({
      url: url,
      type: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: opt,
      timeout: 10000,
    });

    request.done((device) => {
      // Deviceモデルを更新する
      this.devices.replace(device);
      info('デバイス名の編集が完了しました');
      return device;
    });

    request.fail(() => {
      alert('デバイス名の編集に失敗しました');
      return;
    });
  }

  /**
   * デバイスを削除する
   *
   * @param {String} deviceId DeviceのID
   * @memberof Controller
   */
  deleteDevice(deviceId) {
    const url = `/api/users/me/devices/${deviceId}`;
    const token = this.getToken();
    const request = $.ajax({
      url: url,
      type: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    request.done(() => {
      // Deviceモデルから削除
      this.devices.delete(deviceId);
      info('デバイスの削除が完了しました');
    });

    request.fail(() => {
      alert('デバイスの削除に失敗しました');
    });
  }

  /**
   * サーバからMessageの一覧を取得する
   *
   * @param {callback} cb
   * @param {String} deviceId Device ID
   * @param {Error} err Error object
   * @param {Allay} err Message情報のリスト
   * @memberof Controller
   */
  getMessageList(deviceId, cb) {
    const token = this.getToken();
    $.ajax({
      type: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      dataType: 'json',
      url: `/api/users/me/devices/${deviceId}/messages?` +
        'filter[fields][id]=true&filter[fields][deviceId]=true' +
        '&filter[fields][status]=true&filter[fields][name]=true' +
        '&filter[fields][class]=true' +
        '&filter[order]=name ASC',
      timeout: 10000,
      success: function(messageList) {
        cb(null, messageList);
      },
      error: function() {
        const err = new Error();
        cb(err);
      },
    });
  }

  /**
   * メッセージを追加する
   *
   * @param {String} deviceId Device ID
   * @param {Object} opt メッセージ情報のオブジェクト
   * @memberof Controller
   */
  addMessage(deviceId, opt) {
    opt = opt || {};
    const sendUrl = `/api/users/me/devices/${deviceId}/messages`;
    const token = this.getToken();
    const request = $.ajax({
      url: sendUrl,
      type: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: opt,
      timeout: 10000,
    });

    request.done((message) => {
      info('リモコンデータの登録が完了しました');
      // Messageモデルに追加する
      const device = this.devices.findById(deviceId);
      device.messages.push(message);
      return message;
    });

    request.fail(() => {
      alert('リモコンデータの登録に失敗しました');
      return;
    });
  }

  /**
   * メッセージを編集する
   *
   * @param {String} deviceId Device ID
   * @param {String} messageId Message ID
   * @param {Object} opt メッセージ情報のオブジェクト
   * @memberof Controller
   */
  editMessage(deviceId, messageId, opt) {
    opt = opt || {};
    const url = `/api/users/me/devices/${deviceId}` +
      `/messages/${messageId}`;
    const token = this.getToken();
    const request = $.ajax({
      url: url,
      type: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: opt,
      timeout: 10000,
    });

    request.done((message) => {
      info('リモコンデータ名の編集が完了しました');
      // Messageモデルを更新する
      const device = this.devices.findById(deviceId);
      device.messages.replace(message);
      return message;
    });

    request.fail(() => {
      alert('リモコンデータ名の編集に失敗しました');
      return;
    });
  }

  /**
   * メッセージを削除する
   *
   * @param {String} deviceId Device ID
   * @param {String} messageId Message ID
   * @memberof Controller
   */
  deleteMessage(deviceId, messageId) {
    const url = `/api/users/me/devices/${deviceId}` +
      `/messages/${messageId}`;
    const token = this.getToken();
    const request = $.ajax({
      url: url,
      type: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    request.done(() => {
      info('リモコンデータの削除が完了しました');
      const device = this.devices.findById(deviceId);
      device.messages.delete(messageId);
    });

    request.fail(() => {
      alert('リモコンデータの削除に失敗しました');
    });
  }

  /**
   * メッセージを送信する
   *
   * @param {String} deviceId Device ID
   * @param {String} messageId Message ID
   * @memberof Controller
   */
  sendMessage(deviceId, messageId) {
    this.deviceView.sendStart(messageId);
    const sendUrl = `/api/users/me/devices/${deviceId}/send`;
    const token = this.getToken();
    const request = $.ajax({
      url: sendUrl,
      type: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {messageId: messageId},
      timeout: 10000,
    });
    request.done(() => {
      info('リモコンデータの送信に成功しました');
      this.deviceView.sendStop(messageId);
    });

    request.fail((jqXHR) => {
      switch (jqXHR.status) {
        case 503:
          alert('デバイスがオフラインです。接続してから送信をしてください。');
          break;
        case 500:
          alert('リモコンデータの送信に失敗しました。');
          break;
        default:
          alert('リモコンデータの送信に失敗しました。');
          break;
      }
      this.deviceView.sendStop(messageId);
    });
  }

  /**
   * メッセージを受信する
   *
   * @param {String} deviceId Device ID
   * @param {String} messageId Message ID
   * @memberof Controller
   */
  receiveMessage(deviceId, messageId) {
    const data = {status: 'receiving'};
    const url = `/api/users/me/devices/${deviceId}/messages/${messageId}`;
    const token = this.getToken();
    const request = $.ajax({
      url: url,
      type: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: data,
      timeout: 10000,
    });

    request.done(() => {
      // メッセージ受信ボタンを読み込み状態にする
      this.deviceView.receiveStart();

      // メッセージ受信状態をポーリングする
      let pollingCount = 1;
      const maxPollingCount = 5;
      const pollingMessageStatus = setInterval(() => {
        const url = `/api/users/me/devices/${deviceId}` +
          `/messages/${messageId}?` +
          'filter[fields][id]=true&filter[fields][deviceId]=true' +
          '&filter[fields][status]=true&filter[fields][name]=true' +
          '&filter[fields][class]=true';
        const token = this.getToken();
        const poll = $.ajax({
          url: url,
          type: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          dataType: 'json',
          timeout: 10000,
        });

        let lastMessage = {};
        const device = this.devices.findById(deviceId);
        poll.done((message) => {
          lastMessage = message;
          switch (message.status) {
            case 'ready':
              clearInterval(pollingMessageStatus);
              // Messageモデルを更新する
              device.messages.replace(message);
              info('リモコンデータの登録が完了しました');

              // メッセージ受信ボタンの回転を停止する
              this.deviceView.receiveStop();
              break;
            case 'initialized':
              device.messages.replace(message);
              alert('時間内にリモコンデータが受信できませんでした');

              // メッセージ受信ボタンの回転を停止する
              this.deviceView.receiveStop();
              return clearInterval(pollingMessageStatus);
          }
        });

        request.fail(() => {
          clearInterval(pollingMessageStatus);
          alert('リモコンデータの受信に失敗しました');
          // メッセージ受信ボタンの回転を停止する
          this.deviceView.receiveStop();
        });

        if (pollingCount >= maxPollingCount) {
          clearInterval(pollingMessageStatus);
          device.messages.replace(lastMessage);
          alert('時間内にリモコンデータが受信できませんでした');
          // メッセージ受信ボタンの回転を停止する
          this.deviceView.receiveStop();
        }

        pollingCount++;
      }, 3000);
    });

    request.fail((jqXHR) => {
      switch (jqXHR.status) {
        case 503:
          alert('デバイスがオフラインです。接続してから受信をしてください。');
          break;
        case 500:
          alert('リモコンデータの受信に失敗しました。');
          break;
        default:
          alert('リモコンデータの受信に失敗しました。');
          break;
      }
      // メッセージ受信ボタンの回転を停止する
      this.deviceView.receiveStop();
    });
  }

  /**
   * 音声入力から最適な操作を提案して送信する
   *
   * @memberof Controller
   */
  voice() {
    this.deviceView.startSuggest();
    this.sttClient.stream((err, stream) => {
      if (err) {
        alert('音声操作に失敗しました');
        return;
      }
      stream.on('error', () => {
        alert('音声操作に失敗しました');
      });
      setTimeout(()=> {
        this.deviceView.listenSuggest();
      }, 700);
      stream.setEncoding('utf8');
      stream.on('data', (data) => {
        if (data.length < 4) {
          this.deviceView.retrySuggest();
        } else {
          this.deviceView.finishSuggest(data);
          stream.stop();
          this.suggest(data);
        }
      });
      document.querySelector('#suggestStopButton').onclick = () => {
        stream.stop();
        this.deviceView.cancelSuggest();
      };
    });
  }

  /**
   * 音声入力から最適な操作を提案して送信する
   *
   * @param {String} text 提案のインプットとなる自然言語テキスト
   * @memberof Controller
   */
  suggest(text) {
    const data = {text: text};

    const url = '/api/users/me/suggest';
    const token = this.getToken();
    const request = $.ajax({
      url: url,
      type: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: data,
      timeout: 10000,
    });

    request.done((messages) => {
      messages.forEach((message) => {
        info(`音声操作により${message.name}が送信されました`);
      });
    });

    request.fail((jqXHR) => {
      switch (jqXHR.status) {
        case 503:
          alert('デバイスがオフラインです。接続してから受信をしてください。');
          break;
        case 500:
          alert('最適なリモコンデータが見つかりませんでした。');
          break;
        default:
          alert('最適なリモコンデータが見つかりませんでした。');
          break;
      }
    });
  }
}

module.exports = Controller;
