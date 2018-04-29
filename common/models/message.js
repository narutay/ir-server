'use strict';

module.exports = function(message) {
  const debug = require('debug')('irserver:message');
  const changeStatusTimeout = 10 * 1000; // 10sec

  const allowedStatusEnum = [
    'initialized',
    'receiving',
    'ready',
  ];

  function statusValidator(err) {
    if (!allowedStatusEnum.includes(this.status)) {
      err();
    }
  }

  message.validate('status', statusValidator, {
    message: `status is allowed only ${allowedStatusEnum}`,
  });

  message.findMessage = function(messageId, cb) {
    message.findById(messageId, (err, result) => {
      if (err || result === null) {
        debug(`failed find message [${messageId}]`);
        const err = new Error();
        err.statusCode = 500;
        return cb(err);
      } else {
        return cb(null, result);
      }
    });
  };

  function receiveMessage(deviceId, messageId, cb) {
    const app = message.app;
    const appClient = app.get('iotAppClient');
    const data = JSON.stringify({messageId: messageId});
    appClient.publishToDevice(deviceId, 'read', data, (err) => {
      if (err) {
        return cb(err);
      } else {
        return cb();
      }
    });
  }

  function changeMessageStatus(id, beforeStatus, afterStatus) {
    message.findMessage(id, (err, result) => {
      if (err || result.status === undefined) {
        debug(`Message [${id}] update failed: ${beforeStatus} => ${afterStatus}`);
        return;
      }
      const currentStatus = result.status;
      if (currentStatus === beforeStatus) {
        const messageData = {status: afterStatus};
        message.update({id: id}, messageData, (err) => {
          if (err) {
            debug(`Message [${id}] update failed: ${beforeStatus} => ${afterStatus}`);
          } else {
            debug(`Message [${id}] updated: ${beforeStatus} => ${afterStatus}`);
          }
        });
      }
    });
  }

  message.observe('before save', (ctx, next) => {
    if (ctx.isNewInstance === undefined && ctx.data.status !== undefined) {
      const id = ctx.where.id;
      const newStatus = ctx.data.status;
      message.findMessage(id, (err, result) => {
        if (err) {
          return next(err);
        }
        const currentStatus = result.status;
        const deviceId = result.deviceId;
        const messageId = result.id;
        if (currentStatus === 'initialized' && newStatus === 'receiving' ||
            currentStatus === 'ready' && newStatus === 'receiving') {
          receiveMessage(deviceId, messageId, (err) => {
            if (err) {
              return next(err);
            }
            setTimeout(() => {
              changeMessageStatus(messageId, 'receiving', 'initialized');
            }, changeStatusTimeout);
            return next();
          });
        } else if (currentStatus === 'ready' && newStatus === 'initialized') {
          return next();
        } else if (currentStatus === 'receiving' && newStatus === 'initialized') {
          return next();
        } else if (currentStatus === 'receiving' && newStatus === 'ready') {
          return next();
        } else {
          debug(`failed find message [${messageId}]`);
          const err = new Error(`not alloed change status [${currentStatus}] => [${newStatus}]`);
          err.statusCode = 400;
          return next(err);
        }
      });
    } else {
      return next();
    }
  });
};
