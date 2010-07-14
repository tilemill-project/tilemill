/**
 * Utility method for reversing an array.
 */
$.fn.reverse = [].reverse;

/**
 * Add jQuery.validate plugin rules.
 */
jQuery.validator.addClassRules({
  url2: { url2: true }
});

/**
 * Default settings for TileMill client. If a settings.js override is not
 * included these settings will be used instead.
 */
var TileMill = {
  editor: {},
  utilities: {},
  settings: {
    server: 'simple',
    rasterizer: 'tilelive',
    runtime: 'html',
    simpleServer: 'http://localhost:8889/',
    tileliveServer: 'http://localhost:8888/'
  }
};

/**
 * Controllers can be added and registered as callbacks in the route method.
 */
TileMill.controller = {};

/**
 * Route a hashchange or other request to the proper controller.
 */
TileMill.route = function() {
  var fn;
  var url = $.bbq.getState("action");
  switch (url) {
    case undefined:
    case 'list':
      fn = 'list';
      break;
    case 'project':
      fn = 'project';
      break;
    case 'visualization':
      fn = 'visualization';
      break;
  }
  if (TileMill.controller[fn]) {
    $('body').attr('id', fn).empty().append('<div class="loading"></div>');
    TileMill.controller[fn]();
  }
  else {
    TileMill.errorPage('Page not found');
  }
};

/**
 * Simulate a browser "page load" by fully replacing DOM elements in the body.
 */
TileMill.show = function(data) {
  $('body').empty().append(data);
};

/**
 * Show a message popup (error, status, etc).
 */
TileMill.message = function(title, message, type) {
  type = type || 'status';
  var popup = TileMill.template('popup-message', {content: message, type: type});
  TileMill.popup.show({title: title, content: popup});
  return false;
};

/**
 * Show an error page.
 */
TileMill.errorPage = function(message) {
  TileMill.show(TileMill.template('error-page', {message: message}));
};

/**
 * Initial bootstrap. Bind routing to any hash change event and trigger an
 * initial hash change.
 */
$(function() {
  $(window).bind("hashchange", function() {
    TileMill.route();
  }).trigger('hashchange');
});
