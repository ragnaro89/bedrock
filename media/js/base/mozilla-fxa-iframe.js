/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// create namespace
if (typeof Mozilla === 'undefined') {
    var Mozilla = {};
}

Mozilla.FxaIframe = (function() {
    'use strict';

    var _config;
    var _gaEventName;

    var _handshake = false;
    var _host = $('#fxa-iframe-config').data('host');
    var _$iframe = $('#fxa');
    var _src = _$iframe.data('src');

    // remove trailing slash from iframe src (if present)
    _host = (_host[_host.length - 1] === '/') ? _host.substr(0, _host.length - 1) : _host;

    // check user's Fx version to determine FxA iframe experience
    if (Mozilla.Client.FirefoxMajorVersion >= 46) {
        _src = _src.replace('context=iframe', 'context=fx_firstrun_v2');
    }

    var _init = function(userConfig) {
        // store user supplied config
        _config = userConfig;

        // set up postMessage listener
        window.addEventListener('message', _onMessageReceived, true);

        // if specified, pre-populate email address in iframe form
        if (_config.userEmail && /(.+)@(.+)\.(.+){2,}/.test(_config.userEmail)) {
            _src = _src + '&email=' + encodeURIComponent(_config.userEmail);
        }

        // initialize GA event name
        _gaEventName = _config.gaEventName || 'fxa';

        // call iframe to life by setting src attribute
        _$iframe.attr('src', _src);

        // set a timeout to show FxA (error page, most likely) should the ping event fail
        setTimeout(function() {
            if (!_handshake) {
                _showIframe(400);
            }
        }, 2500);
    };

    var _showIframe = function(height) {
        _$iframe.css('height', height + 'px').addClass('loaded');
    };

    var _sendGAEvent = function(type, extra) {
        // we'll always have a type
        var data = {
            'event': _gaEventName,
            'interaction': type
        };

        // merge additional properties if available
        if (extra) {
            $.extend(data, extra);
        }

        window.dataLayer.push(data);
    };

    // postMessage communication handlers
    var _onMessageReceived = function(e) {
        // make sure origin is as expected
        if (e.origin !== _host) {
            return;
        }

        var data = JSON.parse(e.data);

        switch (data.command) {
        // iframe is pinging host page
        case 'ping':
            _onPing(e.data);
            break;
        // iframe has loaded successfully
        case 'loaded':
            _onLoaded(data);
            break;
        // iframe has changed size due to content change
        case 'resize':
            _onResize(data);
            break;
        // user has signed up, but not yet verified email
        case 'signup_must_verify':
            _onSignupMustVerify(data);
            break;
        // user has returned to page after verifying email (may never happen)
        case 'verification_complete':
            _onVerificationComplete();
            break;
        // user has logged in (instead of signing up)
        case 'login':
            _onLogin();
            break;
        }
    };

    var _onPing = function(data) {
        // tell iframe we are expecting it
        var fxaFrameTarget = _$iframe[0].contentWindow;
        fxaFrameTarget.postMessage(data, _host);

        // remember frame has loaded
        _handshake = true;

        if (typeof _config.onPing === 'function') {
            _config.onPing(data);
        }
    };

    var _onLoaded = function(data) {
        _sendGAEvent('impression');

        if (typeof _config.onLoaded === 'function') {
            _config.onLoaded(data);
        }
    };

    var _onResize = function(data) {
        // update iframe to accommodate new height
        _showIframe(data.data.height);

        if (typeof _config.onResize === 'function') {
            _config.onResize(data);
        }
    };

    var _onSignupMustVerify = function(data) {
        // if emailOptIn property is present, send value to GA
        if (data.data.hasOwnProperty('emailOptIn')) {
            _sendGAEvent('email opt-in', { 'label': data.data.emailOptIn });
        }

        if (typeof _config.onSignupMustVerify === 'function') {
            _config.onSignupMustVerify(data);
        }
    };

    var _onVerificationComplete = function(data) {
        _sendGAEvent('verified');

        if (typeof _config.onVerificationComplete === 'function') {
            _config.onVerificationComplete(data);
        }
    };

    var _onLogin = function() {
        _sendGAEvent('sign-in');

        // no custom callback here, as redirect may cancel callback

        window.location.href = _host + '/settings';
    };

    // public properties/methods
    return {
        // Must be called from page specific script to initialize the iframe
        //
        // userConfig: optional object containing any of the following:
        //     gaEventName: string name of GA event (generally customized per
        //         page - defaults to 'fxa')
        //     onPing: function called after iframe 'ping' postMessage
        //     onLoaded: function called after iframe 'loaded' postMessage
        //     onResize: function called after iframe 'resize' postMessage
        //     onSignupMustVerify: function called after iframe
        //         'signup_must_verify' postMessage
        //     onVerificationComplete: function called after iframe
        //         'verification_complete' postMessage
        //     userEmail: email address to be pre-populated in iframe form
        init: function(userConfig) {
            _init(userConfig || {});
        }
    };
})(window.jQuery, window.Mozilla);
