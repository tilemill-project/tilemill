TileMill = {};
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
      // @TODO: Fix Young's lazy code.
      if (confirm('Are you sure you want to delete this layer?')) {
        $(this).parents('li').hide('fast', function() {
          $(this).remove();
        });
      }
      return false;
    }))
    .append($('<a class="layer-inspect" href="#">Inspect</a>').click(function() {
      if (!$(this).parents('li').attr('id')) {
        alert('You need to add an id to a field and save to inspect it.');
        return;
      }
      TileMill.save(false);
      $('#layers').hide();
      $('#inspector').show();
      $('#inspector').data('id', $(this).parents('li').attr('id'));
      url = window.server + 'projects/mml?id=' + window.project_id + '&c=' + (new Date().getTime());
      encode = Base64.encode(url);
      $.getJSON(window.tilelive + encode + "/fields.json?jsoncallback=?", TileMill.inspect);
      return false;
    }))
    .append($('<a class="layer-edit" href="#">Edit</a>').click(function() {
      var options = $(this).parents('li').data('tilemill');
      if ($('#popup-layer').is(':hidden')) {
        $('#popup, #popup-layer, #popup-backdrop, #popup-header').show();
        $('#popup-layer input:not(.submit)').val('');
        $('#popup-layer input.submit').val('Save').data('li', $(this).parents('li'));
        $('#popup-layer input#classes').val(options.classes.join(' '));
        $('#popup-layer input#id').val(options.id);
        $('#popup-layer input#srs').val(options.srs);
        $('#popup-layer input#dataSource').val(options.dataSource);
        $('#popup-header h2').text('Edit layer');
        $('#popup-info').hide();
      }
      return false;
    }))
    .append($('<label>' + layerName + '</label>'));
  if (options.status == 'true') {
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
    url = window.server + 'projects/mml?id=' + window.project_id + '&c=' + (new Date().getTime());
    encode = Base64.encode(url);
    TileMill.layer = new OpenLayers.Layer.XYZ("Preview", window.tilelive + 'tile/' + encode + '/${z}/${x}/${y}.png');
    TileMill.map.addLayers([ TileMill.layer ]);

    // Set the map's initial center point
    TileMill.map.setCenter(new OpenLayers.LonLat(0, 0), 2);

    // Add control
    var control = new OpenLayers.Control.Navigation({ 'zoomWheelEnabled': true });
    TileMill.map.addControl(control);
    control.activate();
  }
  // Update map.
  else {
    url = window.server + 'projects/mml?id=' + window.project_id + '&c=' + (new Date().getTime());
    encode = Base64.encode(url);
    layer = new OpenLayers.Layer.XYZ("Preview " + TileMill.counter, window.tilelive + 'tile/' + encode + '/${z}/${x}/${y}.png');
    TileMill.map.removeLayer(TileMill.layer);
    TileMill.map.addLayers([layer]);
    TileMill.layer = layer;
  }
};

TileMill.initColors = function() {
  TileMill.farbtastic = $.farbtastic($('#farbtastic'), {callback:'input#color', width:200, height:200});
  $('#color-picker a.color-picker').click(function() {
    $('#farbtastic').toggle('fast');
  });
};

TileMill.initCodeEditor = function() {
  TileMill.mirror = CodeMirror.fromTextArea('code', {
    height: "auto",
    parserfile: "parsecss.js",
    stylesheet: static_path + "css/code.css",
    path: static_path + "js/codemirror/js/"
  });
};

TileMill.save = function(map) {
  var mml = TileMill.mml();
  $.post('/projects/mml', {
    'id': window.project_id,
    'data': mml,
  });
  TileMill.mssSave(project_id);
  if (map == undefined) {
    TileMill.initMap();
  }
  else if (!!map) {
    TileMill.initMap();
  }
}

TileMill.mml = function() {
  var output = ['<' + '?xml version="1.0" encoding="utf-8"?>',
  '<!DOCTYPE Map[',
  '  <!ENTITY srs900913 "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs">',
  '  <!ENTITY srsWGS84 "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs">',
  ']>',
  '<Map srs="&srs900913;">'];
  output.push('  <Stylesheet src="' + window.server + 'projects/mss?id='+ project_id +'&amp;filename='+ project_id +'" />');
  $('#layers ul.sidebar-content li').each(function() {
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
    l += ' srs="&srs' + (layer.srs == '900913' ? '900913' : 'WGS84') + ';"';
    if (!$(this).is(':checked')) {
      l += ' status="off"';
    }
    l += '>';
    output.push(l);
    output.push('    <Datasource>');
    output.push('      <Parameter name="file">' + layer.dataSource + '</Parameter>');
    output.push('      <Parameter name="type">shape</Parameter>');
    output.push('    </Datasource>');
    output.push('  </Layer>');
  });
  output.push('</Map>');
  return output.join("\n");
}

TileMill.mss = function(file) {
  $.get('/projects/mss', {'id': project_id, 'filename': file}, function(data) {
    TileMill.mirror.setCode(data);
    TileMill.reloadColors(data);
    setInterval(function() {
      TileMill.reloadColors(TileMill.mirror.getCode());
    }, 5000);
  });
}

TileMill.mssSave = function(file) {
  $.post('/projects/mss', {'id': project_id, 'filename': file, 'data': TileMill.mirror.getCode() });
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

TileMill.inspect = function(data) {
  $('#layers ul.sidebar-content').empty();
  index = $('#inspector').data('id');
  for (field in data[index]) {
    $('#layers ul.sidebar-content').append('<li><strong>' + field + '</strong> <em>' + data[index][field] + '</em></li>');
  }
}

$(function() {
  $(mml).find('Layer').each(function() {
    status = $(this).attr('status');
    if (status == 'undefined') {
      status = true;
    }
    else if (status == 'on') {
      status = true;
    }
    else {
      status = false;
    }
    classes = []
    if ($(this).attr('class')) {
      classes = $(this).attr('class').split(' ');
    }
    TileMill.addLayer({
      classes: classes,
      id: $(this).attr('id'),
      status: status,
      dataSource: $(this).find('Datasource Parameter[name=file]').text(),
      srs: $(this).attr('srs').replace({'&srs': '', ';': ''})
    });
  });
  $('#layers ul.sidebar-content').sortable({
    axis: 'y',
    handle: 'div.handle',
  });

  $('a.inspector-close').click(function() {
    $('#layers').show();
    $('#inspector').hide();
    return false;
  });

  TileMill.initMap();
  TileMill.initColors();
  TileMill.initCodeEditor();

  $('a#layers-add').click(function() {
    if ($('#popup-layer').is(':hidden')) {
      $('#popup, #popup-layer, #popup-backdrop, #popup-header').show();
      $('#popup-layer input:not(.submit)').val('');
      $('#popup-layer').addClass('new');
      $('#popup-layer input.submit').text('Add layer');
      $('#popup-header h2').text('Add layer');
      $('#popup-info').hide();
    }
    return false;
  });

  $('#popup-layer input.submit').click(function() {
    var layer = {
      classes: $('#popup-layer input#classes').val().split(' '),
      id: $('#popup-layer input#id').val(),
      dataSource: $('#popup-layer input#dataSource').val(),
      srs: $('#popup-layer input#srs').val(),
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
    if ($('#popup-info').is(':hidden')) {
      $('#popup, #popup-info, #popup-backdrop, #popup-header').show();
      $('#popup-header h2').text('Info');
      
      $('#popup-layer').hide();
    }
    return false;
  });

  TileMill.mss(project_id);
});