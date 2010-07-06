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
    .append($('<a class="layer-inspect" href="#">Inspect</a>').click(function() {
      $('#layers').hide();
      $('#inspector').show();
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
      }
    }))
    .append($('<label>' + layerName + '</label>'));
  if (options.status == 'true') {
    checkbox[0].checked = true;
  }
  $('#layers ul.sidebar-content').prepend(li.data('tilemill', options));
};

TileMill.initMap = function(hosts, layername, type) {
  // @TODO: have these options be passed by TileMill to point to TileLiteLive.
  var hosts = hosts || [ "http://a.tile.mapbox.com/","http://b.tile.mapbox.com/", "http://c.tile.mapbox.com/", "http://d.tile.mapbox.com/" ],
      layername = layername || 'world-light',
      type = type || 'png';

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
    var map = new OpenLayers.Map('map-preview', options);
    var layer = new OpenLayers.Layer.TMS("Preview", hosts, {layername: layername, type: type});
    map.addLayers([ layer ]);

    // Set the map's initial center point
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);

    // Add control
    var control = new OpenLayers.Control.Navigation({ 'zoomWheelEnabled': true });
    map.addControl(control);
    control.activate();
  }
  // Update map.
  else {
  }
};

TileMill.initColors = function() {
  $('#farbtastic').farbtastic({callback:'input#color', width:200, height:200});
  $('#color-picker a.color-picker').click(function() {
    $('#farbtastic').toggle('fast');
  });
};

TileMill.save = function() {
  var mml = TileMill.mml();
  $.post('/projects/mml', {
    'id': window.project_id,
    'data': mml,
  });
  
}

TileMill.mml = function() {
  var output = ['<' + '?xml version="1.0" encoding="utf-8"?>',
  '<!DOCTYPE Map[',
  '  <!ENTITY srs900913 "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs">',
  '  <!ENTITY srsWGS84 "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs">',
  ']>',
  '<Map srs="&srs900913;">'];
  $('#layers ul.sidebar-content li').each(function() {
    var layer = $(this).data('tilemill'), l = '  <Layer';
    if (layer.id) {
      l += ' id="' + layer.id + '"';
    }
    if (layer.classes) {
      l += ' class="' + layer.classes.join(' ') + '"';
    }
    if (layer.classes) {
      l += ' class="' + layer.classes.join(' ') + '"';
    }
    if (!layer.srs) {
      layer.srs = '900913';
    }
    l += ' srs="&srs' + (layer.srs == '900913' ? '900913' : 'WGS84') + ';"';
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

  $('a#layers-add').click(function() {
    if ($('#popup-layer').is(':hidden')) {
      $('#popup, #popup-layer, #popup-backdrop, #popup-header').show();
      $('#popup-layer input:not(.submit)').val('');
      $('#popup-layer').addClass('new');
      $('#popup-layer input.submit').text('Add layer');
      $('#popup-header').text('Add layer');
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
      $(li).find('label').text(layerName).data('tilemill', layer);
    }
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    $('#popup-layer').removeClass('new');
    return false;
  })

  $('a#popup-close').click(function() {
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    $('#popup-layer').removeClass('new');
  });
});
