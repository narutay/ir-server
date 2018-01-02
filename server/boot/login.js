module.exports = function(app) {
  var debug = require('debug')('irserver:login')

  // Flash messages for passport
  var flash      = require('express-flash');
  app.use(flash());

  var async = require('async');

  var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
  
  app.get('/', ensureLoggedIn('/login'), function(req, res, next) {
    if(!req.accessToken.id)
      return next({message: 'Authorization Required', statusCode: 401});
    debug('Found accessToken: %s', req.accessToken.id);

    var deviceFilter = { where: { ownerId: req.accessToken.userId }};
    app.models.device.find(deviceFilter, function(err, devices) {
      if(err) {
        return next({message: 'Internal Server Error', statusCode: 500});
      }else{
        for(let device of devices){
          debug("Found devices: %s", JSON.stringify(device));
        }

        //デバイス一覧に紐づくメッセージデータを全て取得する
        var deviceMessages = [];
        async.each(devices, function(device, callback){
          deviceId = device.id;
          deviceSerial = device.serial;
          deviceName = device.name;
          var messageFilter = { where: { deviceId: deviceId }};
          app.models.message.find(messageFilter, function(err, messages) {
            dm = { deviceId: deviceId,
                   deviceSerial: deviceSerial,
                   deviceName: deviceName,
                   messages: messages
            };
            debug("deviceMessage: %s ", JSON.stringify(dm));
            deviceMessages.push(dm);
            callback();
          });
        }, function(err){
          debug("all deviceMessages: %s", JSON.stringify(deviceMessages));
          res.render('pages/index', {
            deviceMessages: deviceMessages,
            user: req.user,
            url: req.url,
          });
        });
      };
    });
  });
  
  app.get('/login', function(req, res, next) {
    res.render('pages/login', {
      user: req.user,
      url: req.url,
    });
  });
  
  app.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
  });
}
