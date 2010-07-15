TileMill.backend = {};
TileMill.backend.servers = { 'simple': {} };
TileMill.backend.rasterizers = { 'tilelive': {} };
TileMill.backend.runtimes = { 'html': {}, 'AIR': {} };
TileMill.backend.runtime = {};

/**
 * Simple HTTP storage backend, python and PHP implementations are provided
 * with TileMill.
 */
TileMill.backend.servers.simple.list = function(filename, callback) {
  TileMill.backend.runtime.get({
    'url': TileMill.settings.simpleServer + 'list',
    'data': { 'filename': filename },
    'callback': function(response) {
      if (response.status) {
        callback(response.data);
      }
      else {
        callback();
      }
    },
    json: true
  });
};

TileMill.backend.servers.simple.get = function(filename, callback) {
  TileMill.backend.runtime.get({
    'url': TileMill.settings.simpleServer + 'file',
    'data': { 'filename': filename },
    'callback': function(data) {
      callback(data);
    }
  });
};

TileMill.backend.servers.simple.post = function(filename, file_data, callback) {
  TileMill.backend.runtime.post({
    'url': TileMill.settings.simpleServer + 'file',
    'data': { 'filename': filename, 'data': file_data }, 
    'callback': callback
  });
};

TileMill.backend.servers.simple.url = function(filename) {
  return TileMill.settings.simpleServer + 'file?filename=' + filename;
};

/**
 * TileLive rasterizer and introspection backend.
 */

/**
 * Retrieve datasource information for a given b64 encoded datasource url.
 */
TileMill.backend.rasterizers.tilelive.datasource = function(datab64, callback) {
  var cache = TileMill.cache.get('tilelive-datasource', datab64);
  if (cache) {
    callback(cache);
  }
  else {
    TileMill.backend.runtime.get({
      'url': TileMill.settings.tileliveServer.split(',')[0] + datab64 + "/data.json",
      'callback': callback,
      'json': true
    });
  }
};

/**
 * Retrieve fields for a given b64 encoded MML url.
 */
TileMill.backend.rasterizers.tilelive.fields = function(mmlb64, callback) {
  var cache = TileMill.cache.get('tilelive-fields', mmlb64);
  if (cache) {
    callback(cache);
  }
  else {
    TileMill.backend.runtime.get({
      'url': TileMill.settings.tileliveServer.split(',')[0] + mmlb64 + "/fields.json",
      'callback': callback,
      'json': true
    });
  }
};

/**
 * Retrieve values.
 */
TileMill.backend.rasterizers.tilelive.values = function(options) {
  var cid = options.mmlb64 + options.layer + options.field + options.start + options.limit,
      cache = TileMill.cache.get('tilelive-values', cid);
  if (cache) {
    options.callback(cache);
  }
  else {
    var url = TileMill.settings.tileliveServer.split(',')[0] + options.mmlb64 + '/' + Base64.urlsafe_encode(options.layer) + '/' + Base64.urlsafe_encode(options.field) + "/values.json?";
    if (options.start) {
      url += 'start=' + options.start + '&';
    }
    if (options.limit) {
      url += 'limit=' + options.limit + '&';
    }
    TileMill.backend.runtime.get({
      'url': url,
      'callback': function(data) {
        TileMill.cache.set('tilelive-values', cid, data);
        options.callback(data);
      },
      'json': true
    });
  }
};

/**
 * For a given b64 encoded MML url, return an array of URLs suitable for use
 * as OpenLayers tile servers.
 */
TileMill.backend.rasterizers.tilelive.servers = function(mmlb64) {
  var split = TileMill.settings.tileliveServer.split(',');
  var servers;
  if (split.length > 1) {
    servers = [];
    for (i = 0; i < split.length; i++) {
      servers.push(split[i] + 'tile/' + mmlb64 + '/${z}/${x}/${y}.png');
    }
  }
  else {
    servers = TileMill.settings.tileliveServer + 'tile/' + mmlb64 + '/${z}/${x}/${y}.png';
  }
  return servers;
};

TileMill.backend.runtimes.html.get = function(options) {
  var url = options.url;
  if (url.indexOf('?') !== -1) {
    url = url + '&jsoncallback=?';
  }
  else {
    url = url + '?jsoncallback=?';
  }
  $.getJSON(url, options.data, options.callback);
};

TileMill.backend.runtimes.html.post = function(options) {
  var iframe = $('<iframe></iframe>').attr({width: 0, height: 1 }).appendTo('body')[0];
  var doc = null;
  if (iframe.contentDocument) {
    // Firefox, Opera
    doc = iframe.contentDocument;
  }
  else if (iframe.contentWindow) {
    // Internet Explorer
    doc = iframe.contentWindow.document;
  }
  else if (iframe.document) {
    // Others?
    doc = iframe.document;
  }
  if (doc === null) {
    throw "Document not initialized";
  }
  var form = $('<form>').attr({ 'action': options.url, 'method': 'post' });
  for (var key in options.data) {
    form.append($('<input>').attr({ 'type': 'hidden', 'name': key, 'value': options.data[key] }));
  }
  form.appendTo(doc.body)[0].submit();
  $(iframe).bind('load', function() {
    if (options.callback) {
      options.callback();
    }
    $(this).remove();
  });
};

TileMill.backend.runtimes.AIR.get = function(options) {
  $.get(options.url, options.data, function(data) {
    try {
      // Try to parse it as JSON.
      var parsed = JSON.parse(data);
      options.callback(parsed);
    }
    catch (e) {
      // If that doesn't work, parse it as raw data.
      options.callback(data);
    }
  });
};

TileMill.backend.runtimes.AIR.post = function(options) {
  $.post(options.url, options.data, function() {
    options.callback();
  });
};

/**
 * Init methods using the selected backends.
 */
$.each(['get', 'post'], function(i, func) {
  TileMill.backend.runtime[func] = TileMill.backend.runtimes[TileMill.settings.runtime][func];
});

$.each(['list', 'get', 'post', 'url'], function(i, func) {
  TileMill.backend[func] = TileMill.backend.servers[TileMill.settings.server][func];
});

$.each(['datasource', 'fields', 'values', 'servers'], function(i, func) {
  TileMill.backend[func] = TileMill.backend.rasterizers[TileMill.settings.rasterizer][func];
});
