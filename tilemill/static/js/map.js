TileMill.map = {};

TileMill.map.init = function() {
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

    function getZoom(e) {
      if ($('#zoom-display').size()) {
        $('#zoom-display').text('Zoom level ' + TileMill.map.map.getZoom()); 
      }
    }

    // Nav control images.
    // @TODO: Store locally so the application is portable/usable offline?
    OpenLayers.ImgPath = 'http://js.mapbox.com/theme/dark/';

    TileMill.map.map = new OpenLayers.Map('map-preview', options);
    var split = TileMill.settings.tilelive.split(',');
    if (split.length > 1) {
      var servers = [];
      for (i = 0; i < split.length; i++) {
        servers.push(split[i] + 'tile/' + TileMill.mml.url() + '/${z}/${x}/${y}.png');
      }
    }
    else {
      var servers = TileMill.settings.tilelive + 'tile/' + TileMill.mml.url() + '/${z}/${x}/${y}.png';
    }
    TileMill.map.layer = new OpenLayers.Layer.XYZ("Preview", servers);
    TileMill.map.map.addLayers([ TileMill.map.layer ]);

    // Set the map's initial center point
    TileMill.map.map.setCenter(new OpenLayers.LonLat(0, 0), 2);

    // Add control
    var control = new OpenLayers.Control.Navigation({ 'zoomWheelEnabled': true });
    TileMill.map.map.addControl(control);
    control.activate();

    // Fullscreen toggle
    var fullscreen = $('a.map-fullscreen').click(function() {
      $('#map-preview').toggleClass('fullscreen');
      TileMill.map.map.updateSize();
      return false;
    });

    // Display the current zoom level, and keep it up to date
    getZoom();
    TileMill.map.map.events.register("moveend", TileMill.map.map, getZoom);
    TileMill.map.map.events.register("zoomend", TileMill.map.map, getZoom);

    if ($('#map-preview').is('.panzoombar')) {
      var panzoombar = new OpenLayers.Control.PanZoomBar();
      TileMill.map.map.addControl(panzoombar);
      panzoombar.activate();
    }
  }
};

TileMill.map.reload = function() {
  TileMill.map.map.removeLayer(TileMill.map.layer);var split = TileMill.settings.tilelive.split(',');
  if (split.length > 1) {
    var servers = [];
    for (i = 0; i < split.length; i++) {
      servers.push(split[i] + 'tile/' + TileMill.mml.url() + '/${z}/${x}/${y}.png');
    }
  }
  else {
    var servers = TileMill.settings.tilelive + 'tile/' + TileMill.mml.url() + '/${z}/${x}/${y}.png';
  }
  TileMill.map.layer = new OpenLayers.Layer.XYZ("Preview", servers);
  TileMill.map.map.addLayers([TileMill.map.layer]);
}

$(function() {
  TileMill.map.init();
});
