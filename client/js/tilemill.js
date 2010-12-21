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
  settings: {
    server: 'simple',
    rasterizer: 'tilelive',
    runtime: 'html',
    simpleServer: 'http://tilemill/',
    tileliveServer: 'http://localhost:8888/',
    srs: {
      'srs900913': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 ' +
          '+x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
      'srsWGS84': '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'
    }
  },
  data: {}
};

/**
 * Controllers can be added and registered as callbacks in the route method.
 */

var TileMill = Backbone.Controller.extend({
    routes: {
        '': 'list',
        'list': 'list',
        'project': 'project', // TODO: url args
        'visualization': 'visualization',
        'reference': 'reference'
    },
    
    initialize: function() {
      this._list = new ListView;
      this._reference = new ReferenceView;
    },

    list: function() {
      this._list.render();
    },
    
    reference: function() {
      this._reference.render();
    }
});

$(function() {
  var tm = new TileMill();
  Backbone.history.start()
});