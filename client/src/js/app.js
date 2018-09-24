'use strict';

const auth0 = require('auth0-js');
const jwtDecode = require('jwt-decode');
import '../css/style.scss';

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
  const protocolname = location.protocol;

  let tokenRenewalTimeout;
  const lock = new Auth0Lock(AUTH0_CONFIG.audience, AUTH0_CONFIG.domain, {
    auth: {
      autoParseHash: true,
      params: {
       scope: "openid email"
      },
      redirect: false,
      responseType: "token id_token",
    },
    languageDictionary: {
      title: 'irserverへようこそ!'
    },
    theme: {
      labeledSubmitButton: true,
      logo: '/image/logo.png',
      primaryColor: "#3d75ac",
    },
    language: 'ja',
    container: 'loginView',
    },
  );

  const loginView = $('#loginView');
  const homeView = $('#homeView');

  // buttons and event listeners
  const logoutNavButton = $('#logoutNavButton');

  logoutNavButton.click((e) => {
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
      logoutNavButton.css('display', 'block');
      loginView.css('display', 'none');
      lock.hide();
      homeView.fadeIn();
      const Controller = require('./controller');
      const cnt = new Controller($('body'));
    } else {
      logoutNavButton.css('display', 'none');
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

  lock.on("authenticated", function(authResult) {
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
