'use strict';

require('jsrender');
const Message = require('./message');
// ボタンの処理中回転処理用ライブラリ
const Ladda = require('ladda');

class Device {
 /**
  * Deviceのコンストラクタ
  * APIの戻り値をそのまま格納する
  *
  * @param {Object} device Device情報のオブジェクト
  * @param {Messages} messages Messageコレクションのオブジェクト
  */
  constructor(device, messages) {
    this.device = device || {};
    this.messages = messages || {};
  }

  getDevice() {
    return this.devices;
  }

  getMessages() {
    return this.messages;
  }
}

class Devices {
  /**
   * Deviceコレクションのコンストラクタ
   * APIの戻り値をそのまま格納する
   *
   * @memberof Devices
   */
  constructor() {
    this.devices = [];
  }

  /**
   * Deviceのリストをロードする
   *
   * @param {Device} device
   * @memberof Devices
   */
  load(devices) {
    this.devices = devices;
    $(this).trigger('change');
  }

  /**
   * Deviceを追加する関数
   * 追加APIの戻り値をそのまま格納する
   *
   * @param {Object} device
   * @memberof Devices
   */
  push(device) {
    this.devices.push(device);
    $(this).trigger('change');
  }

  /**
   * Device情報を更新（置換）する関数
   *
   * @param {Object} device
   * @memberof Devices
   */
  replace(device) {
    device = device || {};
    const deviceId = device.id;
    this.devices.some((v, i) => {
      if (v.id === deviceId) {
        this.devices[i] = device;
        $(this).trigger('change');
        return;
      }
    });
  }

  /**
   * Device IDからDevieオブジェクトを検索する関数
   *
   * @param {String} deviceId Device ID
   * @memberof Devices
   */
  findById(deviceId) {
    // 要素を抽出する
    const result = $.grep(this.devices, (obj) => {
      return (obj.id === deviceId);
    });
    return result[0];
  }

  /**
   * Deviceを削除する関数
   *
   * @param {String} deviceId Device ID
   * @memberof Devices
   */
  delete(deviceId) {
    this.devices.some((v, i) => {
      if (v.id === deviceId) {
        this.devices.splice(i, 1);
        // delete this.messages[deviceId];
        $(this).trigger('change');
        return;
      }
    });
  }
}

class DeviceView {
  /**
   * Deviceビューのコンストラクタ
   * APIの戻り値をそのまま格納する
   *
   * @param {Object} element jQueryのエレメント
   * @param {Device} devices Deviceクラスオブジェクト
   * @memberof DeviceView
   */
  constructor($element, devices) {
    this.$element = $element;
    this.$devices = devices;
    this.$deviceList = $element.find('#deviceList');

    // Deviceビューが利用するエレメントの検索・登録
    this.$addDeviceButton = $element.find('#addDeviceButton');
    this.$addDeviceModal = $element.find('#addDeviceModal');
    this.$newDeviceName = $element.find('#newDeviceName');
    this.$newDeviceSerial = $element.find('#newDeviceSerial');

    this.$editDeviceButton = $element.find('#editDeviceButton');
    this.$editDeviceModal = $element.find('#editDeviceModal');
    this.$editDeviceName = $element.find('#editDeviceName');
    this.$editDeviceSerial = $element.find('#editDeviceSerial');

    this.$deleteDeviceModal = $element.find('#deleteDeviceModal');
    this.$deleteDeviceButton = $element.find('#deleteDeviceButton');

    // Messageビューが利用するエレメントの検索・登録
    this.$addMessageButton = $element.find('#addMessageButton');
    this.$addMessageModal = $element.find('#addMessageModal');
    this.$newMessageName = $element.find('#newMessageName');
    this.$newMessageClass = $element.find('#newMessageClass');

    this.$editMessageButton = $element.find('#editMessageButton');
    this.$editMessageModal = $element.find('#editMessageModal');
    this.$editMessageName = $element.find('#editMessageName');
    this.$editMessageClass = $element.find('#editMessageClass');

    this.$deleteMessageModal = $element.find('#deleteMessageModal');
    this.$deleteMessageButton = $element.find('#deleteMessageButton');

    this.$receiveMessageModal = $element.find('#receiveMessageModal');
    this.$receiveMessageButton = $element.find('#receiveMessageButton');

    this.$suggestButton = $element.find('#suggestButton');
    this.$suggestModal = $element.find('#suggestModal');
    this.$suggestInfoText = $element.find('#suggestInfoText');
    this.$suggestInProgress = $element.find('#suggestInProgress');
    this.$suggestText = $element.find('#suggestText');

    // イベント登録=>デバイスモデルの要素の変更で表示を更新する
    this.devices = devices;
    $(this.devices).on('change', () => this.render());

    // イベント登録=>デバイス追加モーダル表示時に入力項目をリセットする
    this.$addDeviceModal.on('show.bs.modal', () => {
      this.$newDeviceName.val(null);
      this.$newDeviceSerial.val(null);
    });

     // イベント登録=>デバイス追加ボタンクリック
    this.$addDeviceButton.on('click', () => {
      const newDeviceName = this.$newDeviceName.val();
      const newDeviceSerial = this.$newDeviceSerial.val();
      $(this).triggerHandler(
        'addDevice',
        {deviceName: newDeviceName, deviceSerial: newDeviceSerial}
      );
      this.$addDeviceModal.modal('hide');
    });

    // イベント登録=>デバイス編集モーダル表示時にデバイス名をセットする
    this.$editDeviceModal.on('show.bs.modal', (event) => {
      const button = $(event.relatedTarget);
      const deviceId = this.getDeviceId(button);
      const device = this.devices.findById(deviceId);
      const deviceName = device.name;
      this.$editDeviceSerial.text(`シリアル番号 ： ${deviceId}`);
      this.$editDeviceName.val(deviceName);
    });
    this.$editDeviceModal.on('shown.bs.modal', () => {
      this.$editDeviceName.focus();
    });

    // イベント登録=>デバイス編集モーダルを閉じた後にデバイスIDをクリアする
    this.$editDeviceModal.on('hidden.bs.modal', () => {
      this.$editDeviceName.val(null);
      this.$editDeviceSerial.text('シリアル番号 ： ');
    });

     // イベント登録=>デバイス編集ボタンクリック
    this.$editDeviceButton.on('click', () => {
      const deviceName = this.$editDeviceName.val();
      const deviceSerial = this.$editDeviceSerial.val();
      $(this).triggerHandler(
        'editDevice',
        {deviceName: deviceName, deviceSerial: deviceSerial}
      );
      this.$editDeviceModal.modal('hide');
    });

    // イベント登録=>デバイス削除モーダル表示時にデバイスIDをセットする
    this.$deleteDeviceModal.on('show.bs.modal', (event) => {
      const button = $(event.relatedTarget);
      const deviceId = this.getDeviceId(button);
      this.$deleteDeviceModal.data('deviceid', deviceId);
    });

    // イベント登録=>デバイス削除モーダルを閉じた後にデバイスIDをクリアする
    this.$deleteDeviceModal.on('hidden.bs.modal', () => {
      this.$deleteDeviceModal.data('deviceid', null);
    });

    // イベント登録=>デバイス削除ボタンクリック(デバイス削除)
    this.$deleteDeviceButton.on('click', () => {
      const deviceId = this.$deleteDeviceModal.data('deviceid');
      $(this).triggerHandler('deleteDevice', deviceId);
      this.$deleteDeviceModal.modal('hide');
    });

    // イベント登録=>メッセージ追加モーダル表示時に入力項目をリセットする
    this.$addMessageModal.on('show.bs.modal', (event) => {
      const button = $(event.relatedTarget);
      const deviceId = this.getDeviceId(button);
      this.$newMessageName.val(null);
      this.$newMessageClass.val('none');
      this.$addMessageModal.data('deviceid', deviceId);
    });

    // イベント登録=>メッセージ追加モーダルを閉じた後にデバイスIDをクリアする
    this.$addMessageModal.on('hidden.bs.modal', () => {
      this.$addMessageModal.data('deviceid', null);
    });

     // イベント登録=>メッセージ追加ボタンクリック
    this.$addMessageButton.on('click', () => {
      const deviceId = this.$addMessageModal.data('deviceid');
      const newMessageName = this.$newMessageName.val();
      const newMessageClass = this.$newMessageClass.val();
      const opt = {};
      opt.deviceId = deviceId;
      opt.data = {
        name: newMessageName,
        class: newMessageClass,
      };
      $(this).triggerHandler('addMessage', opt);
      this.$addMessageModal.modal('hide');
    });

    // イベント登録=>メッセージ編集モーダル表示時にメッセージ名をセットする
    this.$editMessageModal.on('show.bs.modal', (event) => {
      const button = $(event.relatedTarget);
      const messageId = this.getMessageId(button);
      const deviceId = this.getDeviceId(button);
      const device = this.devices.findById(deviceId);
      const messages = device.messages;
      const message = messages.findById(messageId);
      const messageName = message.name;
      const messageClass = message.class;
      this.$editMessageName.val(messageName);
      this.$editMessageClass.val(messageClass);
      this.$editMessageModal.find('.form-group').addClass('is-filled');
      this.$editMessageModal.data('deviceid', deviceId);
      this.$editMessageModal.data('messageid', messageId);
    });
    this.$editMessageModal.on('shown.bs.modal', () => {
      this.$editMessageName.focus();
    });

    // イベント登録=>メッセージ編集モーダルを閉じた後にメッセージIDをクリアする
    this.$editMessageModal.on('hidden.bs.modal', () => {
      this.$editMessageName.val(null);
      this.$editMessageClass.val('none');
      this.$editMessageModal.data('deviceid', null);
      this.$editMessageModal.data('messageid', null);
    });

     // イベント登録=>メッセージ編集ボタンクリック
    this.$editMessageButton.on('click', () => {
      const deviceId = this.$editMessageModal.data('deviceid');
      const messageId = this.$editMessageModal.data('messageid');
      const editMessageName = this.$editMessageName.val();
      const editMessageClass = this.$editMessageClass.val();
      const opt = {};
      opt.deviceId = deviceId;
      opt.messageId = messageId;
      opt.data = {
        name: editMessageName,
        class: editMessageClass,
      };
      $(this).triggerHandler('editMessage', opt);
      this.$editMessageModal.modal('hide');
    });

    // イベント登録=>メッセージ削除モーダル表示時にメッセージIDをセットする
    this.$deleteMessageModal.on('show.bs.modal', (event) => {
      const button = $(event.relatedTarget);
      const messageId = this.getMessageId(button);
      const deviceId = this.getDeviceId(button);
      this.$deleteMessageModal.data('deviceid', deviceId);
      this.$deleteMessageModal.data('messageid', messageId);
    });

    // イベント登録=>メッセージ削除モーダルを閉じた後にメッセージIDをクリアする
    this.$deleteMessageModal.on('hidden.bs.modal', () => {
      this.$deleteMessageModal.data('deviceid', null);
      this.$deleteMessageModal.data('messageid', null);
    });

    // イベント登録=>メッセージ削除ボタンクリック(メッセージ削除)
    this.$deleteMessageButton.on('click', () => {
      const deviceId = this.$deleteMessageModal.data('deviceid');
      const messageId = this.$deleteMessageModal.data('messageid');
      const opt = {};
      opt.deviceId = deviceId;
      opt.messageId = messageId;
      $(this).triggerHandler('deleteMessage', opt);
      this.$deleteMessageModal.modal('hide');
    });

    // イベント登録=>メッセージ受信モーダル表示時にメッセージIDをセットする
    this.$receiveMessageModal.on('show.bs.modal', (event) => {
      const button = $(event.relatedTarget);
      const messageId = this.getMessageId(button);
      const deviceId = this.getDeviceId(button);
      this.$receiveMessageModal.data('deviceid', deviceId);
      this.$receiveMessageModal.data('messageid', messageId);
    });

    // イベント登録=>メッセージ受信モーダルを閉じた後にメッセージIDをクリアする
    this.$receiveMessageModal.on('hidden.bs.modal', () => {
      this.$receiveMessageModal.data('deviceid', null);
      this.$receiveMessageModal.data('messageid', null);
    });

    // イベント登録=>メッセージ受信を開始する
    this.$receiveMessageButton.on('click', () => {
      const deviceId = this.$receiveMessageModal.data('deviceid');
      const messageId = this.$receiveMessageModal.data('messageid');
      const opt = {};
      opt.deviceId = deviceId;
      opt.messageId = messageId;
      $(this).triggerHandler('receiveMessage', opt);
    });

    // イベント登録=>音声操作開始ボタン
    this.$suggestButton.on('click', () => {
      $(this).triggerHandler('suggest');
    });

    // イベント登録=>音声操作モーダル表示時
    this.$suggestModal.on('show.bs.modal', () => {
      this.$suggestInfoText.text('準備中...');
      this.$suggestText.text(null);
      this.$suggestInProgress.css('visibility', 'hidden');
    });
  }

  /**
   * 親要素のDeviceカードからdeviceIdを取得する
   *
   * @param {Object} element jQueryのエレメント
   * @memberof DeviceView
   */
  getDeviceId($element) {
    const $deviceCard = $element.closest('#deviceCard');
    return $deviceCard.data('deviceid');
  }

  /**
   * 親要素のDeviceカードからdeviceIdを取得する
   *
   * @param {Object} element jQueryのエレメント
   * @memberof DeviceView
   */
  getMessageId($element) {
    const $messageCard = $element.closest('#messageCard');
    return $messageCard.data('messageid');
  }

  /**
   * 親要素のDeviceカードからdeviceNameを取得する
   *
   * @param {Object} element jQueryのエレメント
   * @memberof DeviceView
   */
  getDevice($element) {
    const $deviceCard = $element.closest('#deviceCard');
    return $deviceCard.data('deviceid');
  }

  /**
   * "this.$deviceList"にデバイス情報を描画する
   *
   * @memberof DeviceView
   */
  render() {
    const devices = this.devices.devices;
    this.$deviceList.empty();
    const deviceTemplate = $.templates('#deviceCardTemplate');
    const deviceOutput = deviceTemplate.render(devices);
    this.$deviceList.html(deviceOutput);
    let itemsProcessed = 0;
    devices.forEach((device, index, array) => {
      const deviceId = device.id;
      const messagesObj = device.messages;
      device.messageView = new Message.MessageView(
          this.$element,
          deviceId,
          messagesObj
        );
      device.messageView.render();
      // 最後の要素でのアクション
      itemsProcessed++;
      if (itemsProcessed === array.length) {
        // イベント登録=>メッセージ送信ボタンクリック
        this.$sendMessageButton = this.$element.find('[id^=send-btn-]');
        this.$sendMessageButton.on('click', (event) => {
          const button = $(event.currentTarget);
          const messageId = this.getMessageId(button);
          const deviceId = this.getDeviceId(button);
          const opt = {};
          opt.deviceId = deviceId;
          opt.messageId = messageId;
          $(this).triggerHandler('sendMessage', opt);
        });
        // Deviceモデルにデータをロードする
        this.fadeIn();
      }
    });
  }

  /**
   *  "this.$deviceList"をゆっくり表示する
   *
   * @memberof DeviceView
   */
  fadeIn() {
    this.$deviceList.fadeIn();
  }

  /**
   *  メッセージ受信ボタンを読み込み中にする
   *
   * @memberof DeviceView
   */
  receiveStart() {
    const ladda = Ladda.create(document.querySelector('#receiveMessageButton'));
    ladda.start();
    ladda.isLoading();
  }

  /**
   *  メッセージ受信ボタンを通常状態にし、メッセージ受信モーダルを閉じる
   *
   * @memberof DeviceView
   */
  receiveStop() {
    const ladda = Ladda.create(document.querySelector('#receiveMessageButton'));
    ladda.stop();
    this.$receiveMessageModal.modal('hide');
  }

  /**
   *  メッセージ送信ボタンを読み込み中にする
   *
   * @memberof DeviceView
   */
  sendStart(messageId) {
    const ladda = Ladda.create(document.querySelector(`#send-btn-${messageId}`));
    ladda.start();
    ladda.isLoading();
  }

  /**
   *  メッセージ受信ボタンを通常状態にする
   *
   * @memberof DeviceView
   */
  sendStop(messageId) {
    const ladda = Ladda.create(document.querySelector(`#send-btn-${messageId}`));
    ladda.stop();
  }

  /**
   *  提案ボタンを有効化する
   *
   * @memberof DeviceView
   */
  enableSuggest() {
    this.$suggestButton.fadeIn();
  }

  /**
   *  音声操作を開始する
   *
   * @memberof DeviceView
   */
  startSuggest() {
    this.$suggestModal.modal('show');
  }

  /**
   *  音声聞き取り中
   *
   * @memberof DeviceView
   */
  listenSuggest() {
    this.$suggestInfoText.text('何をしますか？話しかけてください。');
    this.$suggestInProgress.css('visibility', 'visible');
  }

  /**
   *  音声が聞こえない
   *
   * @memberof DeviceView
   */
  retrySuggest() {
    this.$suggestInfoText.text('聞き取れませんでした、もう一度話しかけてください。');
    this.$suggestInProgress.css('visibility', 'visible');
  }

  /**
   *  音声操作入力完了
   * @param {String} text 音声入力テキスト
   * @memberof DeviceView
   */
  finishSuggest(text) {
    this.$suggestInfoText.text('音声コマンドを受信しました。');
    this.$suggestText.text(text);
    this.$suggestInProgress.css('visibility', 'hidden');
    setTimeout(()=> {
      this.$suggestModal.modal('hide');
    }, 1200);
  }

  /**
   *  音声操作入力のキャンセル
   * @memberof DeviceView
   */
  cancelSuggest() {
    this.$suggestModal.modal('hide');
  }

}

module.exports.Device = Device;
module.exports.Devices = Devices;
module.exports.DeviceView = DeviceView;
