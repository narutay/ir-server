'use strict';

const auth0 = require('auth0-js');

$(document).ready(() => {
  // マテリアルデザインの有効化
  $('body').bootstrapMaterialDesign();

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
  const protocolname = location.protocol;

  let tokenRenewalTimeout;
  const webAuth = new auth0.WebAuth({
    domain: AUTH0_CONFIG.domain,
    clientID: AUTH0_CONFIG.audience,
    redirectUri: `${protocolname}//${hostname}`,
    responseType: 'token id_token',
    scope: 'openid email',
    leeway: 60,
  });

  const loginView = $('#loginView');
  const homeView = $('#homeView');

  // buttons and event listeners
  const loginNavButton = $('#loginNavButton');
  const loginButton = $('#loginButton');
  const logoutNavButton = $('#logoutNavButton');

  loginButton.click((e) => {
    e.preventDefault();
    webAuth.authorize();
  });

  loginNavButton.click((e) => {
    e.preventDefault();
    webAuth.authorize();
  });

  logoutNavButton.click((e) => {
    e.preventDefault();
    logout();
  });

  function setSession(authResult) {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
    scheduleRenewal();
  }

  function logout() {
    // Remove tokens and expiry time from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    clearTimeout(tokenRenewalTimeout);
    refreshView();
  }

  function isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  function refreshView() {
    if (isAuthenticated()) {
      loginNavButton.css('display', 'none');
      logoutNavButton.css('display', 'block');
      loginView.css('display', 'none');
      homeView.fadeIn();
      const Controller = require('./controller');
      const cnt = new Controller($('body'));
    } else {
      loginNavButton.css('display', 'block');
      logoutNavButton.css('display', 'none');
      homeView.css('display', 'none');
      loginView.fadeIn();
    }
  }

  function handleAuthentication() {
    webAuth.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        setSession(authResult);
      } else if (err) {
        console.log(err);
      }
      refreshView();
    });
  }

  function renewToken() {
    webAuth.checkSession({},
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

  handleAuthentication();
  scheduleRenewal();
});
