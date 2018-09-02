'use strict';

require('bootstrap-material-design');
require('snackbarjs');
require('jsrender');
const Ladda = require('ladda');
require('whatwg-fetch');
const recognizeMicrophone = require('watson-speech/speech-to-text/recognize-microphone');
const messageClassDisplayName = require('../../../lib/message-class.json');

function alert(msg) {
  const options = {
    content: `エラー ： ${msg}`,
    style: 'snackbar',
    timeout: 3000,
  };
  $.snackbar(options);
}

function info(msg) {
  const options = {
    content: msg,
    style: 'snackbar',
    timeout: 3000,
  };
  $.snackbar(options);
}

let targetDeviceId = '';
let targetMessageId = '';

$(document).ready(() => {
  $('body').bootstrapMaterialDesign();

  $('form').submit(() => {
    clearAllFormValues();
    return false;
  });

  function clearAllFormValues() {
    $('input,textarea, select').val('');
  }

  const suggestButton = document.querySelector('#suggestButton');
  if (suggestButton) {
    let sttToken;
    fetch('/api/users/me/suggestToken', {
      credentials: 'same-origin',
    }).
      then((response) => {
        return response.json();
      }).
      then((data) => {
        console.log(`suggest token received ${data}`);
        if (!data.token) {
          alert('音声操作に失敗しました');
          closeSuggestModal();
          return;
        }
        sttToken = data.token;
      }).
      catch((error) => {
        alert('音声操作に失敗しました');
        closeSuggestModal();
        console.log(error);
      });
    suggestButton.onclick = function() {
      if (!sttToken) {
        alert('音声操作に失敗しました。ブラウザをリロードしてください。');
        closeSuggestModal();
        return;
      }
      console.log('suggest start');
      $('#suggestInfoText').text('準備中...');
      $('#suggestText').text('');
      $('#suggestModal').modal('show');
      const stream = recognizeMicrophone({
        token: sttToken,
        model: 'ja-JP_BroadbandModel',
        object_mode: false, // eslint-disable-line camelcase
      });
      stream.on('error', (err) => {
        closeSuggestModal();
        alert('音声操作に失敗しました');
        console.log(err);
      });
      setTimeout(()=> {
        $('#suggestInfoText').text('何をしますか？話しかけてください。');
        $('#suggestInProgress').css('visibility', 'visible');
      }, 500);
      stream.setEncoding('utf8');

      stream.on('data', (data) => {
        console.log(`received ${data}`);
        console.log(`received ${data.length}`);
        if (data.length < 4) {
          $('#suggestInfoText').text('聞き取れませんでした、もう一度話しかけてください。');
        } else {
          $('#suggestInfoText').text('音声コマンドを受信しました。');
          $('#suggestText').text(data);
          $('#suggestInProgress').css('visibility', 'hidden');
          stream.stop();
          suggest(data);
          setTimeout(()=> {
            closeSuggestModal();
          }, 1000);
        }
      });
      document.querySelector('#suggestStopButton').onclick = function() {
        stream.stop();
        console.log('suggest canceled');
        closeSuggestModal();
      };
    };
  }

  function closeSuggestModal() {
    $('#suggestModal').modal('hide');
    $('#suggestInProgress').css('visibility', 'hidden');
  }

  $('#addMessageModal').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    targetDeviceId = button.data('deviceid');
  });

  $('#editDeviceNameModal').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    targetDeviceId = button.data('deviceid');
    $('#editDeviceName').val(button.data('devicename'));
    $('#editDeviceNameModal').find('.form-group').addClass('is-filled');
    $('#deviceSerialText').text(`シリアル番号 ： ${targetDeviceId}`);
  });

  $('#editMessageNameModal').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    targetDeviceId = button.data('deviceid');
    targetMessageId = button.data('messageid');
    $('#editMessageName').val(button.data('messagename'));
    $('#editMessageNameModal').find('.form-group').addClass('is-filled');
    $('#editMessageClass').val(button.data('messageclass'));
  });

  $('#deleteMessageModal').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    targetDeviceId = button.data('deviceid');
    targetMessageId = button.data('messageid');
  });

  $('#deleteDeviceModal').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    targetDeviceId = button.data('deviceid');
  });

  $('#receiveMessageModal').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    targetDeviceId = button.data('deviceid');
    targetMessageId = button.data('messageid');
  });
});

const store = new Object;
store.deviceList = [];
store.messageList = {};

store.restoreDeviceList = function(deviceList) {
  this.deviceList = deviceList;
  loadDeviceTemplate(this.deviceList);
};

store.upsertDeviceList = function(device) {
  let exist = false;
  this.deviceList.some((v, i) => {
    if (v.id === device.id) {
      this.deviceList.splice(i, 1);
      exist = true;
    }
  });

  this.deviceList.push(device);
  if (exist) {
    replaceDeviceTemplate(device);
  } else {
    appendDeviceTemplate(device);
  }
  if (this.messageList[device.id] !== undefined &&
      this.messageList[device.id].length > 0) {
    loadMessageTemplate(device.id, this.messageList[device.id]);
  }
};

store.removeDeviceList = function(deviceId) {
  this.deviceList.some((v, i) => {
    if (v.id === deviceId) {
      this.deviceList.splice(i, 1);
      delete this.messageList[deviceId];
      $(`#card-deviceid-${deviceId}`).remove();
    }
  });
};

store.restoreMessageList = function(deviceId, messageList) {
  this.messageList[deviceId] = messageList;
  loadMessageTemplate(deviceId, this.messageList[deviceId]);
};

store.upsertMessageList = function(deviceId, message) {
  let exist = false;
  if (this.messageList[deviceId] !== undefined) {
    const _messageList = this.messageList[deviceId];
    _messageList.some((v, i) => {
      if (v.id === message.id) {
        _messageList.splice(i, 1);
        exist = true;
      }
    });
    _messageList.push(message);
    this.messageList[deviceId] = _messageList;
    if (exist) {
      replaceMessageTemplate(deviceId, message);
    } else {
      appendMessageTemplate(deviceId, message);
    }
  } else {
    this.messageList[deviceId] = [message];
    appendMessageTemplate(deviceId, message);
  }
};

store.removeMessageList = function(deviceId, messageId) {
  if (this.messageList[deviceId] !== undefined) {
    const _messageList = this.messageList[deviceId];
    _messageList.some((v, i) => {
      if (v.id === messageId) {
        _messageList.splice(i, 1);
        $(`#mb-messageid-${messageId}`).remove();
      }
    });
  }
};

function loadDeviceTemplate(deviceList) {
  const deviceTemplate = $.templates('#deviceCardTemplate');
  const deviceOutput = deviceTemplate.render(deviceList);
  $('#deviceList').html(deviceOutput);
}

function appendDeviceTemplate(device) {
  const deviceTemplate = $.templates('#deviceCardTemplate');
  const deviceOutput = deviceTemplate.render(device);
  $('#deviceList').append(deviceOutput);
}

function replaceDeviceTemplate(device) {
  const deviceTemplate = $.templates('#deviceCardTemplate');
  const deviceOutput = deviceTemplate.render(device);
  $(`#card-deviceid-${device.id}`).replaceWith(deviceOutput);
}

function loadMessageTemplate(deviceId, messageList) {
  let itemsProcessed = 0;
  messageList.forEach((message, index, array) => {
    if (message.class) {
      if (message.class === '') {
        messageList[index].classDN = '';
      } else {
        messageList[index].classDN = messageClassDisplayName[message.class];
      }
    }
    itemsProcessed++;
    if (itemsProcessed === array.length) {
      const messageTemplate = $.templates('#messageCardTemplate');
      const messageOutput = messageTemplate.render(messageList);
      $(`#messageList-${deviceId}`).html(messageOutput);
    }
  });
}

function appendMessageTemplate(deviceId, message) {
  if (message.class) {
    if (message.class === '') {
      message.classDN = '';
    } else {
      message.classDN = messageClassDisplayName[message.class];
    }
  }
  const messageTemplate = $.templates('#messageCardTemplate');
  const messageOutput = messageTemplate.render(message);
  $(`#messageList-${deviceId}`).append(messageOutput);
}

function replaceMessageTemplate(deviceId, message) {
  if (message.class) {
    if (message.class === '') {
      message.classDN = '';
    } else {
      message.classDN = messageClassDisplayName[message.class];
    }
  }
  const messageTemplate = $.templates('#messageCardTemplate');
  const messageOutput = messageTemplate.render(message);
  $(`#mb-messageid-${message.id}`).replaceWith(messageOutput);
}

function loadMessageList(deviceId, cb) {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: `/api/users/me/devices/${deviceId}/messages?` +
      'filter[fields][id]=true&filter[fields][deviceId]=true' +
      '&filter[fields][status]=true&filter[fields][name]=true' +
      '&filter[fields][class]=true' +
      '&filter[order]=name ASC',
    timeout: 10000,
    success: function(messageList) {
      store.restoreMessageList(deviceId, messageList);
      cb();
    },
    error: function() {
      alert('Failed to load messages');
      cb();
    },
  });
}

function loadDeviceList() {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: '/api/users/me/devices?filter[order]=name ASC',
    timeout: 10000,
    success: function(deviceList) {
      store.restoreDeviceList(deviceList);
      let itemsProcessed = 0;
      deviceList.forEach((device, index, array) => {
        const deviceId = device.id;
        loadMessageList(deviceId, () => {
          itemsProcessed++;
          if (itemsProcessed === array.length) {
            $('#deviceList').fadeIn();
          }
        });
      });
    },
    error: function() {
      alert('Failed to load devices');
    },
  });
}
window.loadDeviceList = loadDeviceList;

function sendMessage(deviceId, messageId) {
  const ladda = Ladda.create(document.querySelector(`#send-btn-${messageId}`));
  ladda.start();
  ladda.isLoading();
  const sendUrl = `/api/users/me/devices/${deviceId}/send`;
  const request = $.ajax({
    url: sendUrl,
    type: 'POST',
    data: {messageId: messageId},
    timeout: 10000,
  });
  request.done(() => {
    info('リモコンデータの送信に成功しました');
    ladda.stop();
  });

  request.fail(() => {
    alert('リモコンデータの送信に失敗しました');
    ladda.stop();
  });
}
window.sendMessage = sendMessage;

function addDevice() {
  const newDeviceName = $('#newDeviceName').val();
  const newDeviceId = $('#newDeviceSerial').val();
  const sendUrl = '/api/users/me/devices';
  const request = $.ajax({
    url: sendUrl,
    type: 'POST',
    data: {
      id: newDeviceId,
      name: newDeviceName,
    },
    timeout: 10000,
  });

  request.done((device) => {
    info('デバイスの登録が完了しました');
    store.upsertDeviceList(device);
    $('#addDeviceModal').modal('hide');
    $('#deviceList').fadeIn();
  });

  request.fail(() => {
    alert('デバイスの登録に失敗しました');
    $('#addDeviceModal').modal('hide');
  });
}
window.addDevice = addDevice;

function deleteDevice() {
  const url = `/api/users/me/devices/${targetDeviceId}`;
  const request = $.ajax({
    url: url,
    type: 'DELETE',
    timeout: 10000,
  });

  request.done(() => {
    store.removeDeviceList(targetDeviceId);
    info('デバイスの削除が完了しました');
    $('#deleteDeviceModal').modal('hide');
    targetDeviceId = '';
  });

  request.fail(() => {
    alert('デバイスの削除に失敗しました');
    $('#deleteDeviceModal').modal('hide');
    targetDeviceId = '';
  });
}
window.deleteDevice = deleteDevice;

function addMessage() {
  const newMessageName = $('#newMessageName').val();
  const newMessageClass = $('#newMessageClass').val();
  const data = {
    name: newMessageName,
    class: newMessageClass,
  };

  const sendUrl = `/api/users/me/devices/${targetDeviceId}/messages`;
  const request = $.ajax({
    url: sendUrl,
    type: 'POST',
    data: data,
    timeout: 10000,
  });

  request.done((message) => {
    info('リモコンデータの登録が完了しました');
    store.upsertMessageList(targetDeviceId, message);
    $('#addMessageModal').modal('hide');
    targetDeviceId = '';
  });

  request.fail(() => {
    alert('リモコンデータの登録に失敗しました');
    $('#addMessageModal').modal('hide');
    targetDeviceId = '';
  });
}
window.addMessage = addMessage;

function deleteMessage() {
  const url = `/api/users/me/devices/${targetDeviceId}` +
    `/messages/${targetMessageId}`;
  const request = $.ajax({
    url: url,
    type: 'DELETE',
    timeout: 10000,
  });

  request.done(() => {
    info('リモコンデータの削除が完了しました');
    store.removeMessageList(targetDeviceId, targetMessageId);
    $('#deleteMessageModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });

  request.fail(() => {
    alert('リモコンデータの削除に失敗しました');
    $('#deleteMessageModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });
}
window.deleteMessage = deleteMessage;

function updateDeviceName() {
  const name = $('#editDeviceName').val();
  const data = {name: name};

  const url = `/api/users/me/devices/${targetDeviceId}`;
  const request = $.ajax({
    url: url,
    type: 'PUT',
    data: data,
    timeout: 10000,
  });

  request.done((device) => {
    store.upsertDeviceList(device);
    info('デバイス名の編集が完了しました');
    $('#editDeviceNameModal').modal('hide');
    targetDeviceId = '';
  });

  request.fail(() => {
    alert('デバイス名の編集に失敗しました');
    $('#editDeviceNameModal').modal('hide');
    targetDeviceId = '';
  });
}
window.updateDeviceName = updateDeviceName;

function updateMessageName() {
  const name = $('#editMessageName').val();
  const messageClass = $('#editMessageClass').val();
  const data = {
    name: name,
    class: messageClass,
  };

  const url = `/api/users/me/devices/${targetDeviceId}` +
    `/messages/${targetMessageId}`;
  const request = $.ajax({
    url: url,
    type: 'PUT',
    data: data,
    timeout: 10000,
  });

  request.done((message) => {
    store.upsertMessageList(message.deviceId, message);
    info('リモコンデータ名の編集が完了しました');
    $('#editMessageNameModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });

  request.fail(() => {
    alert('リモコンデータ名の編集に失敗しました');
    $('#editMessageNameModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });
}
window.updateMessageName = updateMessageName;

function receiveMessage() {
  const data = {status: 'receiving'};
  const ladda = Ladda.create(document.querySelector('#receiveMessageButton'));

  const url = `/api/users/me/devices/${targetDeviceId}` +
    `/messages/${targetMessageId}`;
  const request = $.ajax({
    url: url,
    type: 'PUT',
    data: data,
    timeout: 10000,
  });

  request.done((msg) => {
    ladda.start();
    ladda.isLoading();

    const messageId = msg.id;
    const deviceId = msg.deviceId;
    let pollingCount = 1;
    const maxPollingCount = 5;
    const pollingMessageStatus = setInterval(() => {
      const url = `/api/users/me/devices/${deviceId}` +
        `/messages/${messageId}?` +
        'filter[fields][id]=true&filter[fields][deviceId]=true' +
        '&filter[fields][status]=true&filter[fields][name]=true' +
        '&filter[fields][class]=true';
      const poll = $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        timeout: 10000,
      });

      poll.done((message) => {
        switch (message.status) {
          case 'ready':
            store.upsertMessageList(message.deviceId, message);
            info('リモコンデータの登録が完了しました');
            $('#receiveMessageModal').modal('hide');
            clearInterval(pollingMessageStatus);
            ladda.stop();
            break;
          case 'initialized':
            $('#receiveMessageModal').modal('hide');
            alert('時間内にリモコンデータが受信できませんでした');
            ladda.stop();
            return clearInterval(pollingMessageStatus);
        }
      });

      request.fail(() => {
        $('#receiveMessageModal').modal('hide');
        alert('リモコンデータの受信に失敗しました');
        ladda.stop();
        clearInterval(pollingMessageStatus);
      });

      if (pollingCount >= maxPollingCount) {
        $('#receiveMessageModal').modal('hide');
        alert('時間内にリモコンデータが受信できませんでした');
        ladda.stop();
        clearInterval(pollingMessageStatus);
      }

      pollingCount++;
    }, 3000);
  });

  request.fail((jqXHR) => {
    switch (jqXHR.status) {
      case 503:
        $('#receiveMessageModal').modal('hide');
        alert('デバイスがオフラインです。接続してから受信をしてください。');
        break;
      case 500:
        $('#receiveMessageModal').modal('hide');
        alert('リモコンデータの受信に失敗しました。');
        break;
      default:
        $('#receiveMessageModal').modal('hide');
        alert('リモコンデータの受信に失敗しました。');
        break;
    }
    ladda.stop();
  });

  targetDeviceId = '';
  targetMessageId = '';
}
window.receiveMessage = receiveMessage;

function suggest(text) {
  const data = {text: text};

  const url = '/api/users/me/suggest';
  const request = $.ajax({
    url: url,
    type: 'POST',
    data: data,
    timeout: 10000,
  });

  request.done((messages) => {
    messages.forEach((message) => {
      info(`音声操作により${message.name}が送信されました`);
    });
  });

  request.fail(() => {
    alert('リモコンの提案に失敗しました');
  });
}
window.suggest = suggest;
