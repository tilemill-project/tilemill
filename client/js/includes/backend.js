TileMill.backend = {
    servers: { simple: {} },
    rasterizers: { tilelive: {} },
    runtimes: { html: {} },
    runtime: {}
};

/**
 * Simple HTTP storage backend, python and PHP implementations are provided
 * with TileMill.
 */
TileMill.backend.servers.simple.list = function(filename, callback) {
  TileMill.backend.runtime.get({
    url: TileMill.settings.simpleServer + 'list',
    data: {
      filename: filename
    },
    success: function(res, status) {
      if (status == 'success') {
        callback(res.data);
      }
      else {
        callback();
      }
    }
  });
};

TileMill.backend.servers.simple.get = function(filename, callback) {
  TileMill.backend.runtime.get({
    url: TileMill.settings.simpleServer + 'file',
    data: {
      filename: filename
    },
    success: function(res) {
      callback(res);
    }
  });
};

TileMill.backend.servers.simple.mtime = function(filename, callback) {
  TileMill.backend.runtime.get({
    url: TileMill.settings.simpleServer + 'mtime',
    data: { 'filename': filename },
    success: function(data) {
      callback(data);
    }
  });
};

TileMill.backend.servers.simple.post = function(filename, file_data, callback) {
  TileMill.backend.runtime.post({
    url: TileMill.settings.simpleServer + 'file',
    data: { 'filename': filename, 'data': file_data },
    success: callback
  });
};

TileMill.backend.servers.simple.del = function(filename, callback) {
  TileMill.backend.runtime.post({
    url: TileMill.settings.simpleServer + 'file',
    data: {
      filename: filename,
      method: 'delete'
    },
    success: callback
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
      url: TileMill.settings.tileliveServer.split(',')[0] +
        datab64 + '/data.json',
      success: callback,
      json: true
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
      url: TileMill.settings.tileliveServer.split(',')[0] +
        mmlb64 + '/fields.json',
      success: callback
    });
  }
};

/**
 * Retrieve values.
 */
TileMill.backend.rasterizers.tilelive.values = function(options) {
  var cid = options.mmlb64 + options.layer +
      options.field + options.start + options.limit,
      cache = TileMill.cache.get('tilelive-values', cid);
  if (cache) {
    options.callback(cache);
  }
  else {
    var url = TileMill.settings.tileliveServer.split(',')[0] +
        options.mmlb64 + '/' + Base64.urlsafe_encode(options.layer) +
        '/' + Base64.urlsafe_encode(options.field) + '/values.json?';
    if (options.start) {
      url += 'start=' + options.start + '&';
    }
    if (options.limit) {
      url += 'limit=' + options.limit + '&';
    }
    TileMill.backend.runtime.get({
      url: url,
      success: function(data) {
        TileMill.cache.set('tilelive-values', cid, data);
        options.callback(data);
      }
    });
  }
};

TileMill.backend.rasterizers.tilelive.status = function(callback) {
  TileMill.backend.runtime.get({
    url: TileMill.settings.tileliveServer.split(',')[0] +
      'status.json',
    success: function(data) {
        if (data.status) {
            callback(true);
        }
    },
    error: function() {
        callback(false);
    },
    json: true
  });
};

/**
 * For a given b64 encoded MML url, return an array of URLs suitable for use
 * as OpenLayers tile servers.
 */
TileMill.backend.rasterizers.tilelive.servers = function(mmlb64) {
  var split = TileMill.settings.tileliveServer.split(',');
  var servers;
  // TODO: rewrite FP
  if (split.length > 1) {
    servers = [];
    for (i = 0; i < split.length; i++) {
      servers.push(split[i] + 'tile/' + mmlb64 + '/${z}/${x}/${y}.png');
    }
  }
  else {
    servers = TileMill.settings.tileliveServer +
      'tile/' + mmlb64 + '/${z}/${x}/${y}.png';
  }
  return servers;
};

TileMill.backend.runtimes.html.get = function(options) {
  $.jsonp($.extend({
      callbackParameter: 'jsoncallback',
      error: function(xOptions, textStatus) {
          // TODO: specify where
          TileMill.message('Error', 'Request ' +
            'failed: could not connect' +
            ' to server',
            'error')
      }
  }, options));
};

TileMill.backend.runtimes.html.post = function(options) {
  var iframe = $('<iframe></iframe>').attr({
      width: 0,
      height: 1
  }).appendTo('body')[0];
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
    throw 'Document not initialized';
  }
  var form = $('<form>').attr({
      action: options.url,
      method: 'post'
  });
  for (var key in options.data) {
    form.append($('<input>').attr({
        type: 'hidden',
        name: key,
        value: options.data[key]
    }));
  }
  var f = form.appendTo(doc.body)[0];
  if (f) {
    f.submit();
    $(iframe).bind('load', function() {
      if (options.success) {
        options.success();
      }
      $(this).remove();
    });
  }
  else {
    if (options.callback) {
      options.success();
    }
    $(this).remove();
  }
};

/**
 * Init methods using the selected backends.
 */
$.each(['get', 'post'], function(i, func) {
  TileMill.backend.runtime[func] =
    TileMill.backend.runtimes[TileMill.settings.runtime][func];
});

$.each(['list', 'get', 'post', 'del', 'url', 'mtime'], function(i, func) {
  TileMill.backend[func] =
    TileMill.backend.servers[TileMill.settings.server][func];
});

$.each(['datasource', 'fields', 'values', 'servers', 'status'], function(i, func) {
  TileMill.backend[func] =
    TileMill.backend.rasterizers[TileMill.settings.rasterizer][func];
});
