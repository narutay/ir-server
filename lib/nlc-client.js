'use strict';

const debug = require('debug')('irserver:nlc');
const NaturalLanguageClassifierV1 = require('watson-developer-cloud/natural-language-classifier/v1');

class NLCClient {
  /**
   * Watson NLCのクライアントコンストラクタ
   *
   * @param {Object} credentials Watson NLCのクレデンシャル情報(VCAP_SERVICES)
   */
  constructor(credentials, classifierId) {
    this.classifier = new NaturalLanguageClassifierV1(credentials);
    this.classifierId = classifierId;
    this.minConfidence = 0.5;
  }

  /**
   * 入力テキストを分類する
   * 最も高い信頼率（0.0から1.0)のクラスが0.5以上であったらそのクラス名を返却する。
   *
   * @param {String} text
   * @callback {Function} cb
   * @param {Error} err Error object
   * @param {Object} className 最も近い分類
   */
  classify(text, cb) {
    const question = {
      text: text,
      classifier_id: this.classifierId, // eslint-disable-line camelcase
    };
    debug(`request NLC classify classifierId: [${this.classifierId}] text: ${text}`);

    // テキストを分類器にかける
    this.classifier.classify(question, (err, response) => {
      // 分類に失敗したとき
      if (err || response === undefined) {
        debug(`failed classifierId: [${this.classifierId}] text: ${text}`);
        const err = new Error();
        err.statusCode = 500;
        return cb(err);
      }

      // 分類器のレスポンスからクラス名と信頼率を取得する
      let confidence = null;
      let className = null;
      try {
        const topClass = response.classes[0];
        confidence = topClass.confidence;
        className = topClass.class_name;
      } catch (e) {
        debug(`failed parse class name from response ${response}. reason: ${e.message}`);
        const err = new Error();
        err.statusCode = 500;
        return cb(err);
      }

      // 信頼率がminConfidence以上であればクラス名を返却
      if (confidence < this.minConfidence) {
        debug(`class [${className}] confidence ${confidence} less than ${this.minConfidence}`);
        const err = new Error();
        err.statusCode = 404;
        return cb(err);
      } else {
        debug(`found class [${className}] confidence: ${confidence}`);
        return cb(null, className);
      }
    });
  }
}

module.exports = NLCClient;
