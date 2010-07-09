TileMill.backend = {};

TileMill.backend.servers = { 'python': {} };
TileMill.backend.rasterizers = { 'tilelive': {} };

// Python backend
TileMill.backend.servers.python.list = function(type, callback) {
  var cache = TileMill.cache.get('python-list', type);
  if (cache) {
    callback(cache);
  }
  else {
    $.getJSON(TileMill.settings.pythonServer + 'list', { 'type': type }, function(data) {
      TileMill.cache.set('python-list', type, data);
      callback(data);
    });
  }
}

TileMill.backend.servers.python.add = function(id, type, callback) {
  // No cache for this.
  $.post(TileMill.settings.pythonServer + 'add', { 'id': id, 'type': type }, function(data) {
    callback(eval('(' + data +')'));
  });
}

TileMill.backend.servers.python.get = function(filename, callback) {
  $.get(TileMill.settings.pythonServer + 'file', { 'filename': filename }, function(data) {
    callback(data);
  });
}

TileMill.backend.servers.python.post = function(filename, file_data, callback) {
  $.post(TileMill.settings.pythonServer + 'file', { 'filename': filename, 'data': file_data }, function(data) {
    if (callback) {
      callback(eval('(' + data +')'));
    }
  });
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
    var head = document.getElementsByTagName("head")[0], script = document.createElement("script");
    script.src = TileMill.settings.tileliveServer.split(',')[0] + mmlb64 + "/fields.json?jsoncallback=" + callback;
    head.insertBefore(script, head.firstChild);
  }
}

TileMill.backend.rasterizers.tilelive.values = function(layer, field) {
  
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
