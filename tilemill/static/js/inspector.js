TileMill.inspector = { inspection: {}, urls: {} };

TileMill.inspector.inspect = function(id) {
  $('#layers').hide();
  index = $('#inspector').find('ul.sidebar-content').empty().end().show().data('id');
  for (field in TileMill.inspection[id]) {
    (function(layer, field) {
      var li = $('<li>')
        .attr('id', 'field-' + field)
        .append($('<a class="inspect-values" href="#inspect-values">See values</a>').click(function() {
          TileMill.inspector.values(field, layer);
          return false;
        }))
        .append('<strong>' + field + '</strong>')
        .append('<em>' + TileMill.inspection[layer][field].replace('int', 'integer').replace('str', 'string') + '</em>')
        .appendTo($('#inspector ul.sidebar-content'));
    })(id, field);
  }
}

TileMill.inspector.load = function() {
  $('.layer-inspect').removeClass('layer-inspect').addClass('layer-inspect-loading');
  encode = TileMill.mml.url();
  var head = document.getElementsByTagName("head")[0], script = document.createElement("script");
  script.src = TileMill.settings.tilelive + encode + "/fields.json?jsoncallback=TileMill.inspector.loadCallback";
  head.insertBefore(script, head.firstChild);
}

TileMill.inspector.loadCallback = function(data) {
  $('.layer-inspect-loading').removeClass('layer-inspect-loading').addClass('layer-inspect');
  TileMill.inspection = data;
}

TileMill.inspector.values = function(field, layer) {
  if (layer) {
    TileMill.page = 0;
    if ($('li#field-' + field + ' div.inspect-values').size()) {
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
      var head = document.getElementsByTagName("head")[0], script = document.createElement("script");
      TileMill.inspector.urls[field] = TileMill.settings.tilelive + encode + '/' + Base64.encode(layer) + '/' + Base64.encode(field) + "/values.json?start={{page}}&jsoncallback=TileMill.inspector.valueCallback";
      script.src = TileMill.inspector.urls[field].replace('{{page}}', TileMill.page * 10);
      head.insertBefore(script, head.firstChild);
    }
  }
  else {
    var head = document.getElementsByTagName("head")[0], script = document.createElement("script");
    script.src = TileMill.inspector.urls[field].replace('{{page}}', TileMill.page * 10);
    head.insertBefore(script, head.firstChild);
  }
}

TileMill.inspector.valueCallback = function(data) {
  if (data.field) {
    var ul = $('<ul class="clearfix inspect-values">')
      .addClass('field-values')
      .append('<li class="min"><strong>Min</strong>: ' + data.min + '</li>')
      .append('<li class="max"><strong>Max</strong>: ' + data.max + '</li>');
    for (var i in data.values) {
      ul.append('<li>' + data.values[i] + '</li>');
    }
    var pager = $('<div class="pager clearfix"></div>')
      .append($('<a class="pager-prev' + (TileMill.page != 0 ? '' : ' disabled') + '" href="#pager-prev">Prev</a>').click(function() {
        if ($(this).is('.disabled')) {
          return false;
        }
        TileMill.page--;
        TileMill.inspector.values(data.field);
        return false;
      }))
      .append($('<a class="pager-next' + ((data.count - (TileMill.page * 10) > 10) ? '' : ' disabled') + '" href="#pager-next">Next</a>').click(function() {
        if ($(this).is('.disabled')) {
          return false;
        }
        TileMill.page++;
        TileMill.inspector.values(data.field);
        return false;
      }));
    var values = $('<div class="inspect-values"></div>').append(ul).append(pager);
    $('li#field-' + data.field + ' div.inspect-values').remove();
    $('li#field-' + data.field).append(values);
  }
}

$(function() {
  $('a.inspector-close').click(function() {
    $('#layers').show();
    $('#inspector').hide();
    return false;
  });
});
