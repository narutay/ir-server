'use strict';

require('whatwg-fetch');
const ls = require('localstorage-ttl');
const recognizeMicrophone = require('watson-speech/speech-to-text/recognize-microphone');

class STTClient {

  /**
   * Watson STT Clientを初期化
   * View からユーザーのイベントを受け取る
   *
   * @param {Object} element jQueryのエレメント
   * @memberof Controller
   */
  constructor() {
  }

  /**
   * Watson STT の一時トークンを取得する
   *
   * @param {Callback} cb
   * @param {Error} err Error object
   * @param {Object} token STTの一時トークンオブジェクト
   */
  stream(cb) {
    this.getToken((err, token) => {
      if (err) {
        return cb(err);
      }
      const stream = recognizeMicrophone({
        token: token.token,
        model: 'ja-JP_BroadbandModel',
        object_mode: false, // eslint-disable-line camelcase
      });
      return cb(null, stream);
    });
  }

  /**
   * Watson STT の一時トークンを取得する
   *
   * @param {Callback} cb
   * @param {Error} err Error object
   * @param {Object} token STTの一時トークンオブジェクト
   */
  getToken(cb) {
    const currentToken = ls.get('token');
    if (currentToken) {
      return cb(null, currentToken);
    }
    const url = '/api/users/me/suggestToken';
    const request = $.ajax({
      url: url,
      type: 'GET',
      timeout: 10000,
    });

    request.done((token) => {
      ls.set('token', token, 60 * 60 * 1000); // 1 hour
      return cb(null, token);
    });

    request.fail(() => {
      const err = new Error();
      return cb(err);
    });
  }
}

module.exports = STTClient;
