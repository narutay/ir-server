'use strict';

module.exports = function(message) {
  message.disableRemoteMethodByName('create');
  message.disableRemoteMethodByName('count');
  message.disableRemoteMethodByName('find');
  message.disableRemoteMethodByName('findById');
  message.disableRemoteMethodByName('deleteById');
  message.disableRemoteMethodByName('patchAttributes');

  message.disableRemoteMethodByName('confirm');
  message.disableRemoteMethodByName('createChangeStream');
  message.disableRemoteMethodByName('exists');
  message.disableRemoteMethodByName('patchOrCreate');
  message.disableRemoteMethodByName('replaceById');
  message.disableRemoteMethodByName('replaceOrCreate');
  message.disableRemoteMethodByName('resetPassword');
  message.disableRemoteMethodByName('updateAll');
  message.disableRemoteMethodByName('updateAttributes');
  message.disableRemoteMethodByName('upsert');
  message.disableRemoteMethodByName('upsertWithWhere');
  message.disableRemoteMethodByName('findOne');
};
