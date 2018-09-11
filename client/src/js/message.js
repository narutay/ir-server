'use strict';

require('jsrender');
const messageClassDisplayName = require('../../../lib/message-class.json');

class Messages {
  /**
   * Messageコレクションのコンストラクタ
   * APIの戻り値をそのまま格納する
   *
   * @param {Object} opt Message情報のオブジェクト
   * @memberof Messages
   */
  constructor(messages) {
    this.messages = messages || [];
  }

  /**
   * Messageのリストをロードする
   *
   * @param {Message} message
   * @memberof Messages
   */
  load(messages) {
    this.messages = messages;
    $(this).trigger('change');
  }

  /**
   * Messageを追加する関数
   * 追加APIの戻り値をそのまま格納する
   *
   * @param {Object} message
   * @memberof Messages
   */
  push(message) {
    this.messages.push(message);
    $(this).trigger('change');
  }

  /**
   * Message情報を更新（置換）する関数
   *
   * @param {Object} message
   * @memberof Messages
   */
  replace(message) {
    message = message || {};
    const messageId = message.id;
    this.messages.some((v, i) => {
      if (v.id === messageId) {
        this.messages[i] = message;
        $(this).trigger('change');
        return;
      }
    });
  }

  /**
   * Message IDからDevieオブジェクトを検索する関数
   *
   * @param {String} messageId Message ID
   * @memberof Messages
   */
  findById(messageId) {
    // 要素を抽出する
    const result = $.grep(this.messages, (obj) => {
      return (obj.id === messageId);
    });
    return result[0];
  }

  /**
   * Messageを削除する関数
   *
   * @param {String} messageId Message ID
   * @memberof Messages
   */
  delete(messageId) {
    this.messages.some((v, i) => {
      if (v.id === messageId) {
        this.messages.splice(i, 1);
        $(this).trigger('change');
        return;
      }
    });
  }
}

class MessageView {
  /**
   * Messageビューのコンストラクタ
   * APIの戻り値をそのまま格納する
   *
   * @param {Object} element jQueryのエレメント
   * @param {Message} messages Messageクラスオブジェクト
   * @memberof MessageView
   */
  constructor($element, deviceId, messages) {
    this.$element = $element;
    this.deviceId = deviceId;
    this.messages = messages;
    this.$deviceCard = this.getDeviceElement(deviceId);
    this.$messageList = this.$deviceCard.find('#messageList');

    // イベント登録=>メッセージモデルの要素の変更で表示を更新する
    this.messages = messages;
    $(this.messages).on('change', () => this.render());
  }

  /**
   * Device IDからDeviceカードのエレメントを取得する
   *
   * @param {String} deviceId Device ID
   * @memberof DeviceView
   */
  getDeviceElement(deviceId) {
    const $deviceCard = this.$element.find(`div[data-deviceid=${deviceId}]`);
    return $deviceCard;
  }

  /**
   * "this.$messageList"にメッセージ情報を描画する
   *
   * @memberof MessageView
   */
  render() {
    this.$messageList.empty();
    const messages = this.messages.messages;
    let itemsProcessed = 0;
    messages.forEach((message, index, array) => {
      if (message.class === 'none' || message.class === '') {
        messages[index].classDN = '';
      } else {
        messages[index].classDN = messageClassDisplayName[message.class];
      }
      itemsProcessed++;
      if (itemsProcessed === array.length) {
        const messageTemplate = $.templates('#messageCardTemplate');
        const messageOutput = messageTemplate.render(messages);
        this.$messageList.html(messageOutput);
      }
    });
  }
}

module.exports.MessageView = MessageView;
module.exports.Messages = Messages;
