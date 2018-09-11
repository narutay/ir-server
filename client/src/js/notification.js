'use strict';

require('snackbarjs');

/**
 * 画面下に情報メッセージを表示する。
 *
 * @param {String} msg 表示するテキスト
 */
module.exports.info = function info(msg) {
  const options = {
    content: msg,
    style: 'snackbar',
    timeout: 3000,
  };
  $.snackbar(options);
};

/**
 * 画面下にエラーメッセージを表示する。
 *
 * @param {String} msg 表示するテキスト
 */
module.exports.alert = function alert(msg) {
  const options = {
    content: `エラー ： ${msg}`,
    style: 'snackbar',
    timeout: 3000,
  };
  $.snackbar(options);
};
