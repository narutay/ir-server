'use strict';

require('bootstrap-material-design');

$(document).ready(() => {
  $('body').bootstrapMaterialDesign();

  $('form').submit(() => {
    clearAllFormValues();
    return false;
  });

  $('form[data-validate]').on('input', function() {
    $(this).find(':submit').attr('disabled', !this.checkValidity());
  });

  function clearAllFormValues() {
    $('input,textarea, select').val('');
  }

  // トップページのみの処理
  if (location.pathname === '/') {
    const Controller = require('./controller');
    const cnt = new Controller($('body'));
  }
});
