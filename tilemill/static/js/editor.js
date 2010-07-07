TileMill = { page:0, uniq: (new Date().getTime()), customSrs: [], url: '' };

$.fn.reverse = [].reverse;

/**
 * Generate the URL of the current project .mml file.
 *
 * @param bool timestamp
 *   Optionally append a timestamp parameter to the URL to avoid
 *   TileLive caching.
 */
TileMill.mmlURL = function(timestamp) {
  var url = window.server + 'projects/mml?id=' + window.project_id;
  //if (timestamp != undefined && !!timestamp) {
    url += '&c=' + TileMill.uniq;
  //}
  url = Base64.encode(url);
  return url;
};

TileMill.addStylesheet = function(options) {
  // If there is no / character, assume this is a single filename.
  if (options.src.split('/').length === 1) {
    var filename = options.src.split('.')[0];
    options.src = window.server + 'projects/mss?id='+ window.project_id +'&filename='+ filename;
  }
  // Otherwise, assume this is a URL.
  else {
    var filename = $.url.setUrl(options.src).param('filename');
  }
  $.get(options.src, function(data) {
    var stylesheet = $('<a class="tab" href="#tab">')
      .text(filename)
      .data('tilemill', options)
      .append($('<input type="hidden">').val(data))
      .append($('<span class="tab-delete">Delete</span>').click(function() {
        if (confirm('Are you sure you want to delete this stylesheet?')) {
          $(this).parents('a.tab').hide('fast', function() {
            $(this).remove();
            // Set the first stylesheet to active.
            TileMill.initCodeEditor($('#tabs a.tab').eq(0), true);
          });
        }
        return false;
      }))
      .click(function() {
        TileMill.initCodeEditor($(this), true);
        return false;
      });
    $('#tabs').append(stylesheet);

    // If a position is defined we are adding stylesheets sequentially. Call
    // the for the addition of the next stylesheet.
    if (typeof options.position !== 'undefined') {
      TileMill.initCodeEditor(stylesheet);
      $('Stylesheet', mml).eq(options.position + 1).each(function() {
        if ($(this).attr('src')) {
          TileMill.addStylesheet({src: $(this).attr('src'), position: options.position + 1});
        }
      });
      // If this is the last stylesheet, do final processing.
      if (!$('Stylesheet', mml).eq(options.position + 1).size()) {
      }
    }
  });
};

TileMill.addLayer = function(options) {
  var layerName = '';
  if (options.id) {
    layerName = '#' + options.id + ' ';
  }
  if (options.classes.length) {
    layerName += '.' + options.classes.join(', .');
  }
  var checkbox = $('<input class="checkbox" type="checkbox" />');
  var li = $('<li>')
    .append($('<div class="handle"></div>'))
    .append(checkbox)
    .append($('<a class="layer-delete" href="#">Delete</a>').click(function() {
      if (confirm('Are you sure you want to delete this layer?')) {
        $(this).parents('li').hide('fast', function() {
          $(this).remove();
        });
      }
      return false;
    }))
    .append($('<a class="layer-inspect" href="#">Inspect</a>').click(function() {
      if (!$(this).parents('li').data('tilemill')['id']) {
        alert('You need to add an id to a field and save to inspect it.');
        return;
      }
      $('#inspector .sidebar-header h2').html('Layers &raquo; ' + $(this).parents('li').find('label').text());
      TileMill.inspect($(this).parents('li').data('tilemill').id);
      TileMill.page = 0;
      return false;
    }))
    .append($('<a class="layer-edit" href="#">Edit</a>').click(function() {
      var options = $(this).parents('li').data('tilemill');
      $('#popup, #popup-layer, #popup-backdrop, #popup-header').show().removeClass('new');
      var layer = $('#popup-layer').find('input.submit').val('Save').data('li', $(this).parents('li')).end();

      options.classes = options.classes.join(' ');
      for (option in options) {
        layer.find('#' + option).val(options[option]).end();
      }

      $('#popup-header h2').text('Edit layer');
      $('#popup-info').hide();
      return false;
    }))
    .append($('<label>' + layerName + '</label>'));
  if (options.status == 'true' || options.status == true) {
    checkbox[0].checked = true;
  }
  $('#layers ul.sidebar-content').prepend(li.data('tilemill', options));
};

TileMill.initMap = function() {
  if (!$('#map-preview').is('.inited')) {
    $('#map-preview').addClass('inited');
    var options = {
      projection: new OpenLayers.Projection("EPSG:900913"),
      displayProjection: new OpenLayers.Projection("EPSG:4326"),
      units: "m",
      numZoomLevels: 12,
      maxResolution: 156543.0339,
      maxExtent: new OpenLayers.Bounds(
        -20037500,
        -20037500,
        20037500,
        20037500
      ),
      controls: []
    };
    TileMill.map = new OpenLayers.Map('map-preview', options);
    TileMill.layer = new OpenLayers.Layer.XYZ("Preview", window.tilelive + 'tile/' + TileMill.mmlURL() + '/${z}/${x}/${y}.png');
    TileMill.map.addLayers([ TileMill.layer ]);

    // Set the map's initial center point
    TileMill.map.setCenter(new OpenLayers.LonLat(0, 0), 2);

    // Add control
    var control = new OpenLayers.Control.Navigation({ 'zoomWheelEnabled': true });
    TileMill.map.addControl(control);
    control.activate();

    // Fullscreen toggle
    var fullscreen = $('a.map-fullscreen').click(function() {
      $('#map-preview').toggleClass('fullscreen');
      TileMill.map.updateSize();
      return false;
    });
  }
  // Update map.
  else {
    TileMill.map.removeLayer(TileMill.layer);
    TileMill.layer = new OpenLayers.Layer.XYZ("Preview", window.tilelive + 'tile/' + TileMill.mmlURL() + '/${z}/${x}/${y}.png');
    TileMill.map.addLayers([TileMill.layer]);
  }
};

TileMill.initColors = function() {
  TileMill.farbtastic = $.farbtastic($('#farbtastic'), {callback:'input#color', width:200, height:200});
  $('#color-picker a.color-picker').click(function() {
    $('#farbtastic').toggle('fast');
  });
};

TileMill.initCodeEditor = function(stylesheet, update) {
  if (stylesheet && stylesheet.data('tilemill')) {
    if (!$('#tabs .active').size() || update === true) {
      var data = $('input', stylesheet).val();
      if (!update) {
        $('#tabs a.active').removeClass('active');
        stylesheet.addClass('active');

        $('#code').val(data);
        TileMill.mirror = CodeMirror.fromTextArea('code', {
          height: "auto",
          parserfile: "parsecss.js",
          stylesheet: static_path + "css/code.css",
          path: static_path + "js/codemirror/js/"
        });
        setInterval(function() {
          TileMill.reloadColors(TileMill.mirror.getCode());
        }, 5000);
        TileMill.reloadColors(data);
      }
      else {
        $('#tabs a.active input').val(TileMill.mirror.getCode());
        $('#tabs a.active').removeClass('active');
        stylesheet.addClass('active');

        TileMill.mirror.setCode(data);
        TileMill.reloadColors(data);
      }
    }
  }
};

TileMill.save = function(map) {
  var mml = TileMill.mml();
  $.post('/projects/mml', {
    'id': window.project_id,
    'data': mml,
  });

  // Make sure latest edits to active tab's text have been recorded.
  $('#tabs a.active input').val(TileMill.mirror.getCode());
  $('#tabs a.tab').each(function() {
    var url = $.url.setUrl($(this).data('tilemill')['src']);
    TileMill.mssSave(url.param('filename'), $('input', this).val());
  });

  TileMill.loadInspection();
  TileMill.uniq = (new Date().getTime());
  TileMill.initMap();
}

TileMill.mml = function() {
  var output = ['<' + '?xml version="1.0" encoding="utf-8"?>',
  '<!DOCTYPE Map[',
  '  <!ENTITY srs900913 "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs">',
  '  <!ENTITY srsWGS84 "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs">',
  ']>',
  '<Map srs="&srs900913;">'];
  $('#tabs a.tab').each(function() {
    var url = $.url.setUrl($(this).data('tilemill')['src']);
    output.push('  <Stylesheet src="' + window.server + 'projects/mss?id='+ url.param('id') +'&amp;filename='+ url.param('filename') +'&amp;c=' + TileMill.uniq + '" />');
  });
  $('#layers ul.sidebar-content li').reverse().each(function() {
    var layer = $(this).data('tilemill'), l = '  <Layer';
    if (layer.id) {
      l += ' id="' + layer.id + '"';
    }
    if (layer.classes) {
      l += ' class="' + layer.classes.join(' ') + '"';
    }
    if (!layer.srs) {
      layer.srs = '900913';
    }
    if (layer.srs == '900913' || layer.srs == 'WGS84') {
      layer.srs = '&srs' + layer.srs + ';';
    }
    l += ' srs="' + $('<span/>').text(layer.srs).html() + '"';
    if (!$(this).attr('checked') == 'checked') {
      l += ' status="off"';
    }
    l += '>';
    output.push(l);
    output.push('    <Datasource>');
    output.push('      <Parameter name="file">' + $('<span/>').text(layer.dataSource).html() + '</Parameter>');
    output.push('      <Parameter name="type">shape</Parameter>');
    if (layer.id) {
      output.push('      <Parameter name="id">' + layer.id + '</Parameter>');
    }
    output.push('    </Datasource>');
    output.push('  </Layer>');
  });
  output.push('</Map>');
  return output.join("\n");
}

TileMill.mssSave = function(file, data) {
  $.post('/projects/mss', {'id': project_id, 'filename': file, 'data': data });
}

TileMill.reloadColors = function(data) {
  matches = data.match(/\#[A-Fa-f0-9]{3,6}/g);
  colors = [];
  for (i = 0; i < matches.length; i++) {
    color = TileMill.farbtastic.RGBToHSL(TileMill.farbtastic.unpack(matches[i]));
    color.push(matches[i]);
    pass = false;
    for (key in colors) {
      if (colors[key][3] == matches[i]) {
        pass = true;
      }
    }
    if (!pass) {
      colors.push(color);
    }
  }
  colors.sort(function(a, b) { return a[2] - b[2] });
  $('div#colors div').empty();
  for (color in colors) {
    $('div#colors div').append($("<a href='#' class='swatch' style='background-color: "+ colors[color][3] +"'><label>"+ colors[color][3] +"</label></a>").click(function() {
      TileMill.insert($(this).text());
    }));
  }
}

TileMill.insert = function(text) {
  var position = TileMill.mirror.cursorPosition();
  TileMill.mirror.insertIntoLine(position.line, position.character, text);
}

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

$(function() {
  $('Stylesheet:first', mml).each(function() {
    if ($(this).attr('src')) {
      TileMill.addStylesheet({src: $(this).attr('src'), position: 0});
    }
  });
  $(mml).find('Layer').each(function() {
    var status = $(this).attr('status');
    if (status == 'undefined' || status == undefined || status == 'on') {
      status = true;
    }
    else {
      status = false;
    }
    var classes = []
    if ($(this).attr('class')) {
      classes = $(this).attr('class').split(' ');
    }
    var srs = $(this).attr('srs'), parsed_srs = srs.replace(/^&srs(.*);$/, '$1');
    if (parsed_srs == srs) {
      var pass = false;
      for (var key in TileMill.customSrs) {
        if (TileMill.customSrs[key] == srs) {
          pass = true;
        }
      }
      if (!pass) {
        TileMill.customSrs.push(srs);
      }
    }
    else {
      srs = parsed_srs;
    }
    TileMill.addLayer({
      classes: classes,
      id: $(this).attr('id'),
      status: status,
      dataSource: $(this).find('Datasource Parameter[name=file]').text(),
      srs: srs
    });
  });
  for (var i in TileMill.customSrs) {
    var srs = TileMill.customSrs[i];
    if (srs.length > 23) {
      srs = srs.substr(0, 20) + '...';
    }
    $('select#srs').append('<option value="' + TileMill.customSrs[i].replace('"', '\\"') + '">' + srs + "</option>");
  }

  $('#layers ul.sidebar-content').sortable({ axis: 'y', handle: 'div.handle' });
  $('#tabs').sortable({ axis: 'x', });

  $('a.inspector-close').click(function() {
    $('#layers').show();
    $('#inspector').hide();
    return false;
  });

  TileMill.initMap();
  TileMill.initColors();
  TileMill.loadInspection(true);

  $('a#layers-add').click(function() {
    $('#popup, #popup-layer, #popup-backdrop, #popup-header').show();
    $('#popup-layer input:not(.submit)').val('');
    $('#popup-layer').addClass('new');
    $('#popup-layer input.submit').text('Add layer');
    $('#popup-header h2').text('Add layer');
    $('#popup-info').hide();
    return false;
  });

  $('#popup-layer input.submit').click(function() {
    var layer = {
      classes: $('#popup-layer input#classes').val().split(' '),
      id: $('#popup-layer input#id').val(),
      dataSource: $('#popup-layer input#dataSource').val(),
      srs: $('#popup-layer select#srs').val(),
      status: 'true'
    };
    if ($('#popup-layer').is('.new')) {
      TileMill.addLayer(layer);
    }
    else {
      var layerName = '';
      if (layer.id) {
        layerName = '#' + layer.id + ' ';
      }
      if (layer.classes) {
        layerName += '.' + layer.classes.join(', .');
      }
      li = $(this).data('li');
      $(li).find('label').text(layerName).end().data('tilemill', layer);
    }
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    $('#popup-layer').removeClass('new');
    return false;
  })

  $('a#popup-close').click(function() {
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    $('#popup-layer').removeClass('new');
  });

  $('div#header a.save').click(function() {
    TileMill.save();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup, #popup-info, #popup-backdrop, #popup-header').show();
    $('#popup-header h2').text('Info');
    $('#popup-info input').val(window.tilelive + 'tile/' + TileMill.mmlURL(true));
    $('#popup-layer').hide();
    return false;
  });
});
