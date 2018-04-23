'use strict';

module.exports = function(app) {
  const debug = require('debug')('irserver:login');

  // Flash messages for passport
  const flash = require('express-flash');
  app.use(flash());

  const async = require('async');

  const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

  app.get('/', ensureLoggedIn('/login'), (req, res, next) => {
    if (!req.accessToken.id)
      return next({message: 'Authorization Required', statusCode: 401});
    debug('Found accessToken: %s', req.accessToken.id);

    const deviceFilter = {where: {userId: req.accessToken.userId}};
    app.models.device.find(deviceFilter, (err, devices) => {
      if (err) {
        return next({message: 'Internal Server Error', statusCode: 500});
      } else {
        for (const device of devices) {
          debug('Found devices: %s', JSON.stringify(device));
        }

        // デバイス一覧に紐づくメッセージデータを全て取得する
        const deviceMessages = [];
        async.each(devices, (device, callback) => {
          const messageFilter = {where: {deviceId: device.id}};
          app.models.message.find(messageFilter, (err, messages) => {
            const dm = {
              deviceId: device.id,
              deviceSerial: device.serial,
              deviceName: device.name,
              messages: messages,
            };
            debug('deviceMessage: %s ', JSON.stringify(dm));
            deviceMessages.push(dm);
            callback();
          });
        }, (err) => {
          debug('all deviceMessages: %s', JSON.stringify(deviceMessages));
          res.render('pages/index', {
            deviceMessages: deviceMessages,
            user: req.user,
            url: req.url,
          });
        });
      }
    });
  });

  app.get('/login', (req, res, next) => {
    res.render('pages/login', {
      user: req.user,
      url: req.url,
    });
  });

  app.get('/logout', (req, res, next) => {
    req.logout();
    res.redirect('/');
  });
};
