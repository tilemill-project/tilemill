/**
 * Field and value inspector.
 */
TileMill.inspector = {
    page: {},
    inspection: {},
    urls: {}
};

/**
 * Init and return markup.
 */
TileMill.inspector.init = function() {
  var inspector = $(TileMill.template('inspector', {}));
  TileMill.inspector.load();
  return inspector;
};

/**
 * Inspect a layer (show its fields).
 */
TileMill.inspector.inspect = function(id, visualize) {
  if (TileMill.inspection &&
    TileMill.inspection[id] &&
    TileMill.inspection[id].fields) {
    $('#inspector ul.sidebar-content').empty();
    for (var field in TileMill.inspection[id].fields) {
      (function(layer, field) {
        var type = TileMill.inspection[layer].fields[field];
        var li = $(TileMill.template('inspector-field', {
          field: field,
          type: type.replace('int', 'integer').replace('str', 'string'),
          visualize: visualize
        }));
        // Attach value inspector.
        $('a.inspect-values', li).click(function() {
          TileMill.inspector.values(layer, field);
          return false;
        });
        // Attach visualization modes.
        if (visualize) {
          TileMill.visualization.attach(field, type, li);
        }
        $('#inspector ul.sidebar-content').append(li);
      })(id, field);
    }
  }
};

/**
 * Load inspector data from the rasterizer backend.
 */
TileMill.inspector.load = function(callback) {
  $('#inspector ul.sidebar-content').addClass('loading');
  TileMill.backend.fields(TileMill.mml.url(), function(data) {
    $('#inspector ul.sidebar-content').removeClass('loading');
    TileMill.inspection = data;

    if (callback) {
      callback();
    }
  });
};

/**
 * Inspect a field (show its values).
 */
TileMill.inspector.values = function(layer, field, pager) {
  var callback = (function(data) {
    if (data.field) {
      var values = $(TileMill.template('inspector-values', {
        min: data.min,
        max: data.max,
        class_prev: (TileMill.inspector.page[layer][field] !== 0 ?
            '' : ' disabled'),
        class_next: ((data.count - (TileMill.inspector.page[layer][field] * 30) > 30) ?
            '' : ' disabled')
      }));
      for (var i in data.values) {
        $('ul', values).append('<li>' + data.values[i] + '</li>');
      }
      $('a.pager-prev', values).click(function() {
        if (!$(this).is('.disabled')) {
          TileMill.inspector.page[layer][field]--;
          TileMill.inspector.values(layer, field, true);
        }
        return false;
      });
      $('a.pager-next', values).click(function() {
        if (!$(this).is('.disabled')) {
          TileMill.inspector.page[layer][field]++;
          TileMill.inspector.values(layer, field, true);
        }
        return false;
      });
      $('li#field-' + data.field + ' div.inspect-values').remove();
      $('li#field-' + data.field).append(values);
    }
  });
  if (!TileMill.inspector.page[layer]) {
    TileMill.inspector.page[layer] = {};
  }
  if (!TileMill.inspector.page[layer][field]) {
    TileMill.inspector.page[layer][field] = 0;
  }
  if (!pager && $('li#field-' + field + ' div.inspect-values').size()) {
    if ($('li#field-' + field + ' div.inspect-values').is(':hidden')) {
      $('#inspector li div.inspect-values').hide();
      $('li#field-' + field + ' div.inspect-values').show();
    }
    else {
      $('li#field-' + field + ' div.inspect-values').hide();
    }
  }
  else {
    $('#inspector li div.inspect-values').hide();
    encode = TileMill.mml.url();
    TileMill.backend.rasterizers.tilelive.values({
      mmlb64: encode,
      layer: layer,
      field: field,
      start: TileMill.inspector.page[layer][field] * 30,
      callback: callback
    });
  }
};
