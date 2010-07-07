TileMill.inspect = function(id) {
  if (!TileMill.inspection) {
    setTimeout(TileMill.inspect, 1000);
    return;
  }
  $('#layers').hide();
  index = $('#inspector').find('ul.sidebar-content').empty().end().show().data('id');
  for (field in TileMill.inspection[id]) {
    (function(layer, field) {
      var li = $('<li>')
        .attr('id', 'field-' + field)
        .append($('<a class="inspect-values" href="#inspect-values">See values</a>').click(function() {
          TileMill.values(layer, field);
          return false;
        }))
        .append('<strong>' + field + '</strong>')
        .append('<em>' + TileMill.inspection[layer][field].replace('int', 'integer').replace('str', 'string') + '</em>')
        .appendTo('#inspector ul.sidebar-content');
    })(id, field);
  }
}

TileMill.loadInspection = function() {
  encode = TileMill.mmlURL();
  var head = document.getElementsByTagName("head")[0], script = document.createElement("script");
  script.src = window.tilelive + encode + "/fields.json?jsoncallback=TileMill._loadInspection";
  head.insertBefore(script, head.firstChild);
}

TileMill._loadInspection = function(data) {
  TileMill.inspection = data;
}

TileMill.values = function(layer, field) {
  if (layer && field) {
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
      encode = TileMill.mmlURL();
      var head = document.getElementsByTagName("head")[0], script = document.createElement("script");
      TileMill.url = window.tilelive + encode + '/' + Base64.encode(layer) + '/' + Base64.encode(field) + "/values.json?start={{page}}&jsoncallback=TileMill._values";
      script.src = TileMill.url.replace('{{page}}', TileMill.page * 10);
      head.insertBefore(script, head.firstChild);
    }
  }
  else {
    var head = document.getElementsByTagName("head")[0], script = document.createElement("script");
    script.src = TileMill.url.replace('{{page}}', TileMill.page * 10);
    head.insertBefore(script, head.firstChild);
  }
}

TileMill._values = function(data) {
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
        TileMill.values();
        return false;
      }))
      .append($('<a class="pager-next' + ((data.count - (TileMill.page * 10) > 10) ? '' : ' disabled') + '" href="#pager-next">Next</a>').click(function() {
        if ($(this).is('.disabled')) {
          return false;
        }
        TileMill.page++;
        TileMill.values();
        return false;
      }));
    var values = $('<div class="inspect-values"></div>').append(ul).append(pager);
    $('li#field-' + data.field + ' div.inspect-values').remove();
    $('li#field-' + data.field).append(values);
  }
}
