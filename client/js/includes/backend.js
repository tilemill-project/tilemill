TileMill.backend = {};

TileMill.backend.servers = { 'python': {} };
TileMill.backend.rasterizers = { 'tilelive': {} };

// Python backend
TileMill.backend.servers.python.list = function(type, callback) {
  $.getJSON(TileMill.settings.pythonServer + 'list?jsoncallback=?', { 'type': type }, function(data) {
    TileMill.cache.set('python-list', type, data);
    callback(data);
  });
}

TileMill.backend.servers.python.add = function(filename, callback) {
  TileMill.utilities.insertIFrame(TileMill.settings.pythonServer + 'add?jsoncallback=?', { 'filename': filename }, callback);
}

TileMill.backend.servers.python.get = function(filename, callback) {
  $.getJSON(TileMill.settings.pythonServer + 'file?jsoncallback=?', { 'filename': filename }, function(data) {
    callback(data);
  });
}

TileMill.backend.servers.python.post = function(filename, file_data, callback) {
  TileMill.utilities.insertIFrame(TileMill.settings.pythonServer + 'file', { 'filename': filename, 'data': file_data }, callback);
}

TileMill.backend.servers.python.url = function(filename) {
  return TileMill.settings.pythonServer + 'file?filename=' + filename;
}

// TileLive backend

/**
 * Retrieve fields for a given b64 encoded MML url.
 */
TileMill.backend.rasterizers.tilelive.fields = function(mmlb64, callback) {
  var cache = TileMill.cache.get('tilelive-fields', mmlb64);
  if (cache) {
    callback(cache);
  }
  else {
    $.getJSON(TileMill.settings.tileliveServer.split(',')[0] + mmlb64 + "/fields.json?jsoncallback=?", callback);
  }
}

TileMill.backend.rasterizers.tilelive.values = function(options) {
  var cid = options.mmlb64 + options.layer + options.field + options.start + options.limit, cache = TileMill.cache.get('tilelive-values', cid);
  if (cache) {
    options.callback(cache);
  }
  else {
    var url = TileMill.settings.tileliveServer.split(',')[0] + options.mmlb64 + '/' + Base64.urlsafe_encode(options.layer) + '/' + Base64.urlsafe_encode(options.field) + "/values.json?"
    if (options.start) {
      url += 'start=' + options.start + '&';
    }
    if (options.limit) {
      url += 'limit=' + options.limit + '&';
    }
    url += 'jsoncallback=?';
    $.getJSON(url, function(data) {
      TileMill.cache.set('tilelive-values', cid, data);
      options.callback(data);
    });
  }
}

/**
 * For a given b64 encoded MML url, return an array of URLs suitable for use
 * as OpenLayers tile servers.
 */
TileMill.backend.rasterizers.tilelive.servers = function(mmlb64) {
  var split = TileMill.settings.tileliveServer.split(',');
  if (split.length > 1) {
    var servers = [];
    for (i = 0; i < split.length; i++) {
      servers.push(split[i] + 'tile/' + mmlb64 + '/${z}/${x}/${y}.png');
    }
  }
  else {
    var servers = TileMill.settings.tileliveServer + 'tile/' + mmlb64 + '/${z}/${x}/${y}.png';
  }
  return servers;
}

$.each(['list', 'add', 'get', 'post', 'url'], function(i, func) {
  TileMill.backend[func] = TileMill.backend.servers[TileMill.settings.server][func];
});

$.each(['fields', 'values', 'servers'], function(i, func) {
  TileMill.backend[func] = TileMill.backend.rasterizers[TileMill.settings.rasterizer][func];
});

TileMill.utilities.insertIFrame = function(url, data, callback) {
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
  if (doc == null) {
    throw "Document not initialized";
  }
  var form = $('<form>').attr({ 'action': url, 'method': 'post' });
  for (key in data) {
    form.append($('<input>').attr({ 'type': 'hidden', 'name': key, 'value': data[key] }));
  }
  form.appendTo(doc.body)[0].submit();
  $(iframe).bind('load', function() {
    $(this).remove();
    callback();
  });
};
