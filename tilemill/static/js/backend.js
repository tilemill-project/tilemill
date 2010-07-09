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

TileMill.backend.servers.python.file = function(filename, callback) {
  var cache = TileMill.cache.get('python-file', filename);
  if (cache) {
    callback(cache);
  }
  else {
    $.get(TileMill.settings.pythonServer + 'file', { 'filename': filename }, function(data) {
      TileMill.cache.set('python-file', filename, data);
      callback(data);
    });
  }
}

TileMill.backend.servers.python.url = function(filename) {
  return TileMill.settings.pythonServer + 'file?filename=' + filename;
}

// TileLive backend
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

$.each(['list', 'add', 'file', 'url'], function(i, func) {
  TileMill.backend[func] = TileMill.backend.servers[TileMill.settings.server][func];
});

$.each(['fields', 'values'], function(i, func) {
  TileMill.backend[func] = TileMill.backend.rasterizers[TileMill.settings.rasterizer][func];
});