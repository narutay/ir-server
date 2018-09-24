'use strict';

const jwtDecode = require('jwt-decode');
require('../css/style.scss');

$(document).ready(() => {
  // マテリアルデザインの有効化
  $('body').bootstrapMaterialDesign();
  $('body').show();

  // submitでPOSTを実行するのを無効化
  $('form').submit(() => {
    // 入力パラメータをクリア
    $('input,textarea,select').val('');
    return false;
  });

  // validateを設定しているformで必須項目と連動したボタンの有効化
  $('form[data-validate]').on('input', function() {
    $(this).find(':submit').attr('disabled', !this.checkValidity());
  });

  $('.navbar-nav li a').click(() => {
    $('.navbar-collapse').collapse('hide');
  });

  const hostname = location.host;
  const protocolname = location.protocol;  let tokenRenewalTimeout;

  const lock = new Auth0Lock(AUTH0_CONFIG.audience, AUTH0_CONFIG.domain, {
    auth: {
      autoParseHash: true,
      params: {
        scope: 'openid email',
      },
      redirect: false,
      responseType: 'token id_token',
    },
    languageDictionary: {
      title: '',
      databaseEnterpriseAlternativeLoginInstructions: 'または',
    },
    theme: {
      labeledSubmitButton: true,
      logo: '/image/logo.png',
      primaryColor: '#3d75ac',
    },
    language: 'ja',
    container: 'loginView',
  });

  const loginView = $('#loginView');
  const homeView = $('#homeView');
  const navbar = $('.navbar');
  const logoutButton = $('#logoutButton');

  logoutButton.click((e) => {
    e.preventDefault();
    logout();
  });

  function setSession(authResult) {
    // Set the time that the access token will expire at
    const decoded = jwtDecode(authResult.idToken);
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', decoded.exp * 1000);
    scheduleRenewal();
  }

  function logout() {
    // Remove tokens and expiry time from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    clearTimeout(tokenRenewalTimeout);
    // refreshView();
    lock.logout({returnTo: `${protocolname}//${hostname}`});
  }

  function isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  function refreshView() {
    if (isAuthenticated()) {
      loginView.css('display', 'none');
      lock.hide();
      navbar.fadeIn();
      homeView.fadeIn();
      const Controller = require('./controller');
      const cnt = new Controller($('body'));
    } else {
      navbar.css('display', 'none');
      homeView.css('display', 'none');
      lock.show();
      loginView.fadeIn();
    }
  }

  function renewToken() {
    lock.checkSession({},
      (err, result) => {
        if (!err) {
          setSession(result);
        }
      });
  }

  function scheduleRenewal() {
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    const delay = expiresAt - Date.now();
    if (delay > 0) {
      tokenRenewalTimeout = setTimeout(() => {
        renewToken();
      }, delay);
    }
  }

  lock.on('authenticated', (authResult) => {
    if (authResult && authResult.accessToken && authResult.idToken) {
      window.location.hash = '';
      setSession(authResult);
    }
    refreshView();
  });

  // handleAuthentication();
  refreshView();
  scheduleRenewal();
});
