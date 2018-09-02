'use strict';

const debug = require('debug')('irserver:stt');
const AuthorizationV1 = require('watson-developer-cloud/authorization/v1');

class STTClient {
  /**
   * Watson STTのクライアントコンストラクタ
   *
   * @param {Object} credentials Watson STTのクレデンシャル情報(VCAP_SERVICES)
   */
  constructor(credentials) {
    this.authorization = new AuthorizationV1({
      username: credentials.username,
      password: credentials.password,
      url: 'https://stream.watsonplatform.net/authorization/api',
    });
    this.username = credentials.username;
    this.sttUrl = credentials.url;
  }

  /**
   * Watson STTの一時トークン発行
   *
   * @callback {Function} cb
   * @param {Error} err Error object
   * @param {Object} token Temporary access token
   */
  getSttToken(cb) {
    this.authorization.getToken({url: this.sttUrl}, (err, token) => {
      if (err || !token) {
        debug(`failed get STT Token by use ${this.credentials.username} err: ${err}`);
        return cb(err);
      } else {
        return cb(null, {token: token});
      }
    });
  }
}

module.exports = STTClient;
