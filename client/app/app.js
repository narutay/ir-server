'use strict';

let targetDeviceId = '';
let targetMessageId = '';

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

$('#addDeviceModal').on('show.bs.modal', () => {
  window.location.href = '/';
});

$('#deleteDeviceModal').on('show.bs.modal', (event) => {
  const button = $(event.relatedTarget);
  targetDeviceId = button.data('deviceid');
});

function saveMessageName() {
  const name = $('#newMessageName').val();
  const data = {name: name};

  const url = `/api/users/me/devices/${targetDeviceId}` +
    `/messages/${targetMessageId}`;
  const request = $.ajax({url: url, type: 'PUT', data: data});

  request.done((msg) => {
    $(`#td-messageid-${targetMessageId}`).text(name);
    $('#editMessageNameModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });

  request.fail((jqXHR, textStatus) => {
    alert(`Request failed: ${textStatus}`);
    targetDeviceId = '';
    targetMessageId = '';
  });
}

function deleteMessage() {
  const url = `/api/users/me/devices/${targetDeviceId}` +
    `/messages/${targetMessageId}`;
  const request = $.ajax({url: url, type: 'DELETE'});

  request.done((msg) => {
    const row = $(`#td-messageid-${targetMessageId}`).closest('tr');
    $(row).remove();
    $('#deleteMessageModal').modal('hide');
    targetDeviceId = '';
    targetMessageId = '';
  });

  request.fail((jqXHR, textStatus) => {
    alert(`Delete message failed: ${textStatus}`);
    targetDeviceId = '';
    targetMessageId = '';
  });
}

function deleteDevice() {
  const url = `/api/users/me/devices/${targetDeviceId}`
  const request = $.ajax({url: url, type: 'DELETE'});

  request.done((msg) => {
    const panel = $(`#panel-deviceid-${targetDeviceId}`);
    $(panel).remove();
    $('#deleteDeviceModal').modal('hide');
    targetDeviceId = '';
  });

  request.fail((jqXHR, textStatus) => {
    alert(`Delete device failed: ${textStatus}`);
    targetDeviceId = '';
  });
}

function sendMessage(targetDeviceId, targetMessageData) {
  const sendUrl = `/api/users/me/devices/${targetDeviceId}/send`;
  const request = $.ajax({
    url: sendUrl,
    type: 'POST',
    data: {data: targetMessageData},
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
  });

  request.done((msg) => {
    $('#addDeviceModal').modal('show');
  });

  request.fail((jqXHR, textStatus) => {
    alert(`Add Device is failed: ${textStatus}`);
  });
}
