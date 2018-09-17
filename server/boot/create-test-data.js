'use strict';

module.exports = function(app) {
  // データソースのアダプタがmemoryの場合、テスト用データを作成
  const adapter = app.datasources.irdb.adapter;
  if (adapter.name === 'memory') {
    const User = app.models.user;
    const Device = app.models.device;
    const Message = app.models.message;
    const userData = {
      username: 'test',
      email: 'test@bar.com',
      password: 'pass',
    };
    User.create(userData, (err, user) => {
      const deviceData = {
        userId: user.id,
        id: 'testdeviceid',
        name: 'TEST DEVICE',
      };
      Device.create(deviceData, (err, device) => {
        console.log(`device id: ${device.id}`);
        const messageData = {
          userId: user.id,
          deviceId: device.id,
          name: 'エアコンオフ',
          class: 'ac_off',
          data: {data: '4 5 3', t_micros: 400},
        };
        Message.create(messageData, (err, message) => {
          console.log(`message id: ${message.id}`);
        });
      });
    });
  }
};
