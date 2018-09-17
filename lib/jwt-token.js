'use strict';
const debug = require('debug')('irserver:jwt');
const CommonError = require('../lib/error');

module.exports = function(app, options) {
  if (!options.secretKey) {
    throw new Error('secretKey must be supplied');
  }
  const userModelName = options.model || 'User';
  const userModel = app.models[userModelName];
  const setRequestObjectName = options.model || 'user';

  // userリテラルの設定
  let currentUserLiteral = options.currentUserLiteral;
  if (currentUserLiteral && (typeof currentUserLiteral !== 'string')) {
    debug('Set currentUserLiteral to \'me\' as the value is not a string.');
    currentUserLiteral = 'me';
  }
  if (typeof currentUserLiteral === 'string') {
    currentUserLiteral = escapeRegExp(currentUserLiteral);
  }

  /**
   * JWTトークンユーザのマッピングをする関数
   *
   * @param {Object} req APIリクエストのコンテキスト
   * @param {Object} res APIレスポンスのコンテキスト
   * @param {callback} next
   */
  const mapToken = function(req, res, next) {
    // express-jwtで付与されたユーザ情報（claim）がない場合エラー
    if (!req[setRequestObjectName]) {
      return next(CommonError.AuthorizationRequiredError);
    }
    const claim = req.user || {};
    const userId = claim.sub.replace('|', '-');

    // claimからアクセストークン情報を付与
    const token = {
      userId: userId,
      id: claim.at_hash,
      ttl: (claim.exp || 0) - (claim.iat || 0),
      createdAt: new Date((claim.iat || 0) * 1000),
    };
    req.accessToken = token;

    // claimから取得したユーザIDを検索し、存在しなければ追加
    userModel.findById(userId, (err, user) => {
      if (err) return next(CommonError.InternalServerError);
      if (!user) {
        const opt = {
          id: userId,
          email: claim.email,
          password: options.secretKey,
        };
        userModel.create(opt, (err) => {
          if (err) return next(CommonError.InternalServerError);
          rewriteUserLiteral(req, currentUserLiteral, next);
        });
      } else {
        rewriteUserLiteral(req, currentUserLiteral, next);
      }
    });
  };

  /*
   * /user/meを /user/:idに置換する
   */
  function rewriteUserLiteral(req, currentUserLiteral, next) {
    if (!currentUserLiteral) return next();
    const literalRegExp = new RegExp(`/${ currentUserLiteral }(/|$|\\?)`, 'g');

    if (req.accessToken && req.accessToken.userId) {
      // Replace /me/ with /current-user-id/
      req.url = req.url.replace(literalRegExp, `/${req.accessToken.userId}$1`);
    } else if (!req.accessToken && literalRegExp.test(req.url)) {
      debug(
        'URL %s matches current-user literal %s,' +
           ' but no (valid) access token was provided.',
        req.url, currentUserLiteral
      );
      return next(CommonError.AuthorizationRequiredError);
    }
    next();
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return mapToken;
};
