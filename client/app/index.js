'use strict';

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

function loadMessageTemplate(deviceId, messageList) {
  const messageTemplate = $.templates('#messageCardTemplate');
  const messageOutput = messageTemplate.render(messageList);
  $(`#messageList-${deviceId}`).html(messageOutput);
}

function appendMessageTemplate(deviceId, message) {
  const messageTemplate = $.templates('#messageCardTemplate');
  const messageOutput = messageTemplate.render(message);
  $(`#messageList-${deviceId}`).append(messageOutput);
}

function loadMessageList(deviceId) {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: `/api/users/me/devices/${deviceId}/messages`,
    timeout: 10000,
    success: function(messageList) {
      loadMessageTemplate(deviceId, messageList);
    },
    error: function() {
      alert('Failed to load messages');
    },
  });
}

function loadDeviceList() {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: '/api/users/me/devices',
    timeout: 10000,
    success: function(deviceList) {
      loadDeviceTemplate(deviceList);
      deviceList.forEach((device) => {
        const deviceId = device.id;
        loadMessageList(deviceId);
      });
      $('#deviceList').fadeIn();
    },
    error: function() {
      alert('Failed to load devices');
    },
  });
}

$('#deviceList').ready(() => {
  loadDeviceList();
});

let targetDeviceId = '';
let targetMessageId = '';

$('#addMessageModal').on('show.bs.modal', (event) => {
  const button = $(event.relatedTarget);
  targetDeviceId = button.data('deviceid');
});

$('#editMessageNameModal').on('show.bs.modal', (event) => {
  const button = $(event.relatedTarget);
  targetDeviceId = button.data('deviceid');
  targetMessageId = button.data('messageid');
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

function sendMessage(targetDeviceId, targetMessageData) {
  const sendUrl = `/api/users/me/devices/${targetDeviceId}/send`;
  const request = $.ajax({
    url: sendUrl,
    type: 'POST',
    data: {data: targetMessageData},
    timeout: 10000,
  });
  request.done((msg) => {
    $('#sendMessageModal').modal('show');
  });

  request.fail((jqXHR, textStatus) => {
    alert(`Request failed: ${textStatus}`);
  });
}

function recieveMessage(targetDeviceId) {
  const sendUrl = `/api/users/me/devices/${targetDeviceId}/recieve`;
  const request = $.ajax({
    url: sendUrl,
    type: 'POST',
    data: {},
    timeout: 10000,
  });
  request.done((msg) => {
    $('#recieveMessageModal').modal('show');
  });

  request.fail((jqXHR, textStatus) => {
    alert(`Request failed: ${textStatus}`);
  });
}

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
    appendDeviceTemplate(device);
    $('#addDeviceModal').modal('hide');
  });

  request.fail((jqXHR, textStatus) => {
    alert('デバイスの登録に失敗しました');
    $('#addDeviceModal').modal('hide');
  });
}

function deleteDevice() {
  const url = `/api/users/me/devices/${targetDeviceId}`;
  const request = $.ajax({
    url: url,
    type: 'DELETE',
    timeout: 10000,
  });

  request.done(() => {
    const card = $(`#card-deviceid-${targetDeviceId}`);
    $(card).remove();
    info('デバイスの削除が完了しました');
    $('#deleteDeviceModal').modal('hide');
    targetDeviceId = '';
  });

  request.fail((jqXHR, textStatus) => {
    alert('デバイスの削除に失敗しました');
    $('#deleteDeviceModal').modal('hide');
    targetDeviceId = '';
  });
}

function addMessage() {
  const newMessageName = $('#newMessageName').val();
  const sendUrl = `/api/users/me/devices/${targetDeviceId}/messages`;
  const request = $.ajax({
    url: sendUrl,
    type: 'POST',
    data: {
      name: newMessageName,
    },
    timeout: 10000,
  });

  request.done((message) => {
    info('メッセージの登録が完了しました');
    appendMessageTemplate(targetDeviceId, message);
    $('#addMessageModal').modal('hide');
    targetDeviceId = '';
  });

  request.fail((jqXHR, textStatus) => {
    alert('メッセージの登録に失敗しました');
    $('#addMessageModal').modal('hide');
    targetDeviceId = '';
  });
}

function deleteMessage() {
  const url = `/api/users/me/devices/${targetDeviceId}` +
    `/messages/${targetMessageId}`;
  const request = $.ajax({
    url: url,
    type: 'DELETE',
    timeout: 10000,
  });

  request.done((msg) => {
    const row = $(`#mb-messageid-${targetMessageId}`);
    $(row).remove();
    info('メッセージの削除が完了しました');
    $('#deleteMessageModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });

  request.fail((jqXHR, textStatus) => {
    alert('メッセージの削除に失敗しました');
    $('#deleteMessageModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });
}

function updateMessageName() {
  const name = $('#editMessageName').val();
  const data = {name: name};

  const url = `/api/users/me/devices/${targetDeviceId}` +
    `/messages/${targetMessageId}`;
  const request = $.ajax({
    url: url,
    type: 'PUT',
    data: data,
    timeout: 10000,
  });

  request.done((msg) => {
    $(`#mb-messageid-${targetMessageId}`).find('span').text(name);
    info('メッセージ名の編集が完了しました');
    $('#editMessageNameModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });

  request.fail((jqXHR, textStatus) => {
    alert('メッセージ名の編集に失敗しました');
    $('#editMessageNameModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });
}
