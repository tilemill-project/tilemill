TileMill = {};
TileMill.addLayer = function(options) {
  console.log(options);
  var layerName = '';
  if (options.id) {
    layerName = '#' + options.id + ' ';
  }
  if (options.classes) {
    layerName += '.' + options.classes.join(', .');
  }
  var checkbox = $('<input class="checkbox" type="checkbox" />');
  var li = $('<li>')
    .append(checkbox)
    .append($('<a class="layer-inspect" href="#">Inspect</a>').click(function() {
      $('#layers').hide();
      $('#inspector').show();
      return false;
    }))
    .append($('<a class="layer-edit" href="#">Edit</a>'))
    .append($('<label>' + layerName + '</label>'));
  if (options.status == 'true') {
    checkbox[0].checked = true;
  }
  $('#layers ul.sidebar-content').prepend(li);
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
    TileMill.addLayer({
      classes: $(this).attr('class').split(' '),
      id: $(this).attr('id'),
      status: status,
      dataSource: $(this).find('Datasource Parameter[name=file]').text(),
      srs: $(this).attr('srs').replace({'&srs': '', ';': ''})
    });
  });
  $('#layers ul.sidebar-content').sortable({
    axis: 'y'
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
    }
  });

  $('a#popup-close').click(function() {
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    $('#popup-layer').removeClass('new');
  });
});
