
$(documentReady);
  
function documentReady() {
	//$.getJSON('../api/devices', getDevices);
};

var targetDeviceId;
var targetMessageId;

$('#editMessageNameModal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget)
  targetDeviceId = button.data('deviceid')
  targetMessageId = button.data('messageid')
});

function saveMessageName() {
  var name = $('#newMessageName').val();
  data = { name: name };

  url = '/api/devices/' + targetDeviceId + '/messages/' + targetMessageId
  request = $.ajax({url: url, type: 'PUT', data: data});

  request.done(function(msg) {
    $('#td-messageid-' + targetMessageId).text(name);
    $('#editMessageNameModal').modal('hide');
    //window.location.href = "/";
    targetDeviceId = null;
    targetMessageId = null;
  });

  request.fail(function(jqXHR, textStatus) {
    alert( "Request failed: " + textStatus );
    targetDeviceId = null;
    targetMessageId = null;
  });
}

function sendMessage(targetDeviceId, targetMessageData) {
  var sendUrl = '/api/devices/' + targetDeviceId  + '/send'
  console.log(sendUrl)
  request = $.ajax({url: sendUrl, type: 'POST', data: {data: targetMessageData}});
  request.done(function(msg) {
    $('#sendMessageModal').modal('show');
  });

  request.fail(function(jqXHR, textStatus) {
    alert( "Request failed: " + textStatus );
  });
}

