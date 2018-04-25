'use strict';

function alert(msg) {
  $.iaoAlert({
    msg: msg,
    mode: 'dark',
    alertTime: '4000',
    type: 'error',
  });
}
function info(msg) {
  $.iaoAlert({
    msg: msg,
    mode: 'dark',
    alertTime: '4000',
  });
}

$(document).ready(() => {
  $('body').bootstrapMaterialDesign();
});

$('form').submit(() => {
  clearAllFormValues();
  return false;
});

$('form').on('input', function() {
  $(this).find(':submit').attr('disabled', !this.checkValidity());
});

function clearAllFormValues() {
  $('input,textarea').val('');
}
