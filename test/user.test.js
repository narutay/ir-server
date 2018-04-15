'use strict';

const assert = require('assert');
const app = require('../server/server.js');
const user = app.models.user;
const debug = require('debug')('irserver:test');

describe('user', () => {
  let userData;
  beforeEach((done) => {
    userData = {
      email: 'foo@bar.com',
      password: 'P@ssw0rd',
      username: 'test-user-01',
    };

    user.create(userData, (err, user) => {
      debug(`User created: ${user.id}, ${user.username}, ${user.email}`);
      done();
    });
  });

  afterEach((done) => {
    user.destroyAll((err) => {
      if (err) {
        debug('Destroy user is failed');
      } else {
        debug('All User destroyd');
      }
      done();
    });
  });

  describe('user.send', () => {
    it('appClientの設定が誤っている場合、エラーが発生すること', () => {
      const payload = {
        data: {'t_micros': 500, 'data': [[8, 4], [1, 1]]},
      };
      user.send('id', 'deviceid', payload, (err, result) => {
        debug(err);
        assert(err);
        assert(!result);
      });
    });
  });
});
