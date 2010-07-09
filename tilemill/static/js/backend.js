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
    $.getJSON(TileMill.settings.pythonServer + 'list?jsoncallback=?', { 'type': type }, function(data) {
      TileMill.cache.set('python-list', type, data);
      callback(data);
    });
  }
}

TileMill.backend.servers.python.add = function(id, type, callback) {
  // No cache for this.
  TileMill.utilities.insertIFrame(TileMill.settings.pythonServer + 'add?jsoncallback=?', { 'id': id, 'type': type }, callback);
}

TileMill.backend.servers.python.get = function(filename, callback) {
  $.getJSON(TileMill.settings.pythonServer + 'file?jsoncallback=?', { 'filename': filename }, callback);
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

TileMill.utilities.insertIFrame = function(url, data, callback) {
  var iframe = $('<iframe></iframe>').attr({width: 0, height: 1 }).bind('load', callback).appendTo('body')[0];
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
  if(doc == null) {
    throw "Document not initialized";
  }
  var form = $('<form>').attr({ 'action': url, 'method': 'post' });
  for (key in data) {
    form.append($('<input>').attr({ 'type': 'hidden', 'name': key, 'value': data[key] }));
  }
  form.appendTo(doc.body)[0].submit();

}
