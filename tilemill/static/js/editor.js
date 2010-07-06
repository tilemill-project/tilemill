jQuery.fn.reverse = [].reverse;

TileMill = {};
TileMill.addLayer = function(classes, id, status) {
  var layerName = '';
  if (id) {
    layerName = '#' + id + ' ';
  }
  if (classes) {
    layerName += '.' + classes.join(', .');
  }
  $('<li>')
    .append($('<input class="checkbox" type="checkbox" />').attr('checked', status ? 'checked' : ''))
    .append($('<a class="layer-inspect" href="#">Inspect</a>').click(function() {
      $('#layers').hide();
      $('#inspector').show();
      return false;
    }))
    .append($('<a class="layer-edit" href="#">Edit</a>'))
    .append($('<label>' + layerName + '</label>'))
    .appendTo($('#layers ul.sidebar-content'));
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

$(function() {
  $(mml).find('Layer').reverse().each(function() {
    status = $(this).attr('status');
    TileMill.addLayer($(this).attr('class').split(' '), $(this).attr('id'), !status || $(this).attr('status') == 'on');
  });

  $('a.inspector-close').click(function() {
    $('#layers').show();
    $('#inspector').hide();
    return false;
  });

  TileMill.initMap();
});
