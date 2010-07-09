TileMill.inspector = { page: {}, inspection: {}, urls: {}, valueCache: {} };

TileMill.inspector.inspect = function(id) {
  $('#layers').hide();
  $('#inspector').show();
  for (field in TileMill.inspection[id].fields) {
    (function(layer, field) {
      var li = $('<li>')
        .attr('id', 'field-' + field)
        .append($('<a class="inspect-values" href="#inspect-values">See values</a>').click(function() {
          TileMill.inspector.values(layer, field);
          return false;
        }))
        .append('<strong>' + field + '</strong>')
        .append('<em>' + TileMill.inspection[layer].fields[field].replace('int', 'integer').replace('str', 'string') + '</em>')
        .appendTo($('#inspector ul.sidebar-content'));
    })(id, field);
  }
}

TileMill.inspector.load = function() {
  $('.layer-inspect').removeClass('layer-inspect').addClass('layer-inspect-loading');
  TileMill.backend.fields(TileMill.mml.url(), function(data) {
    $('.layer-inspect-loading').removeClass('layer-inspect-loading').addClass('layer-inspect');
    TileMill.inspection = data;
  });
}

TileMill.inspector.values = function(layer, field, pager) {
  var callback = (function(data) {
    if (data.field) {
      var ul = $('<ul class="clearfix inspect-values">')
        .addClass('field-values')
        .append('<li class="min"><strong>Min</strong>: ' + data.min + '</li>')
        .append('<li class="max"><strong>Max</strong>: ' + data.max + '</li>');
      for (var i in data.values) {
        ul.append('<li>' + data.values[i] + '</li>');
      }
      var pager = $('<div class="pager clearfix"></div>')
        .append($('<a class="pager-prev' + (TileMill.inspector.page[layer][field] != 0 ? '' : ' disabled') + '" href="#pager-prev">Prev</a>').click(function() {
          if ($(this).is('.disabled')) {
            return false;
          }
          TileMill.inspector.page[layer][field]--;
          TileMill.inspector.values(layer, field, true);
          return false;
        }))
        .append($('<a class="pager-next' + ((data.count - (TileMill.inspector.page[layer][field] * 30) > 30) ? '' : ' disabled') + '" href="#pager-next">Next</a>').click(function() {
          if ($(this).is('.disabled')) {
            return false;
          }
          TileMill.inspector.page[layer][field]++;
          TileMill.inspector.values(layer, field, true);
          return false;
        }));
      var values = $('<div class="inspect-values"></div>').append(ul).append(pager);
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
      'mmlb64': encode,
      'layer': layer,
      'field': field,
      'start': TileMill.inspector.page[layer][field] * 30,
      'callback': callback
    });
  }
}
