/* For reference read the Jasmine and Sinon docs
 * Jasmine docs: http://pivotal.github.io/jasmine/
 * Sinon docs: http://sinonjs.org/docs/
 */

/* global describe, beforeEach, afterEach, it, expect, spyOn */
/* eslint camelcase: [2, {properties: "never"}] */
/* eslint new-cap: [2, {"capIsNewExceptions": ["Deferred"]}] */

describe('mozilla-fxa-iframe.js', function() {

    'use strict';

    var config;

    beforeEach(function () {

        var fxaMarkup = [
            '<section id="fxa-iframe-config" data-host="https://www.fxa-test-host.com/">' +
                '<iframe id="fxa" data-src="{{ settings.FXA_IFRAME_SRC }}?utm_campaign=fxa-embedded-form&amp;utm_medium=referral&amp;utm_source=firstrun&amp;utm_content=fx-{{ version }}&amp;entrypoint=firstrun&amp;service=sync&amp;context=iframe&amp;style=chromeless&amp;haltAfterSignIn=true"></iframe>' +
            '</section>'
        ].join();

        $(fxaMarkup).appendTo('body');
    });

    afterEach(function () {
        $('#fxa-iframe-config').remove();
    });

    describe('init', function() {
        it('should initialize the FxA iframe', function() {
            config = {
                gaEventName: 'test-ga'
            };

            Mozilla.FxaIframe.init(config);
        });
    });

});
