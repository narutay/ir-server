'use strict';

let targetDeviceId = '';
let targetMessageId = '';

$('#editMessageNameModal').on('show.bs.modal', (event) => {
  const button = $(event.relatedTarget);
  targetDeviceId = button.data('deviceid');
  targetMessageId = button.data('messageid');
});

function saveMessageName() {
  const name = $('#newMessageName').val();
  const data = {name: name};

  const url = `/api/users/me/devices/${targetDeviceId }` +
    `/messages/${targetMessageId}`;
  const request = $.ajax({url: url, type: 'PUT', data: data});

  request.done((msg) => {
    $(`#td-messageid-${targetMessageId}`).text(name);
    $('#editMessageNameModal').modal('hide');
    targetDeviceId = null;
    targetMessageId = null;
  });

  request.fail((jqXHR, textStatus) => {
    alert(`Request failed: ${ textStatus}`);
    targetDeviceId = null;
    targetMessageId = null;
  });
}

function sendMessage(targetDeviceId, targetMessageData) {
  const sendUrl = `/api/users/me/devices/${ targetDeviceId }/send`;
  const request = $.ajax({
    url: sendUrl,
    type: 'POST',
    data: {data: targetMessageData},
  });
  request.done((msg) => {
    $('#sendMessageModal').modal('show');
  });

  request.fail((jqXHR, textStatus) => {
    alert(`Request failed: ${ textStatus}`);
  });
}
