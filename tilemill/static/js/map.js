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
    TileMill.layer = new OpenLayers.Layer.XYZ("Preview", TileMill.settings.tilelive + 'tile/' + TileMill.mmlURL() + '/${z}/${x}/${y}.png');
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
    TileMill.layer = new OpenLayers.Layer.XYZ("Preview", TileMill.settings.tilelive + 'tile/' + TileMill.mmlURL() + '/${z}/${x}/${y}.png');
    TileMill.map.addLayers([TileMill.layer]);
  }
};

$(function() {
  TileMill.initMap();
});
