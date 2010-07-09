TileMill.map = {};

TileMill.map.init = function(map, servers, controls) {
  if (!map.data('TileMill.map')) {
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

    // Nav control images.
    // @TODO: Store locally so the application is portable/usable offline?
    OpenLayers.ImgPath = 'http://js.mapbox.com/theme/dark/';

    var olMap = new OpenLayers.Map(map.attr('id'), options);
    var olLayer = new OpenLayers.Layer.XYZ("Preview", servers);
    olMap.addLayers([ olLayer ]);

    // Set the map's initial center point
    olMap.setCenter(new OpenLayers.LonLat(0, 0), 2);

    // Add custom controls
    if (controls.navigation) {
      var navigation = new OpenLayers.Control.Navigation({ 'zoomWheelEnabled': true });
      olMap.addControl(navigation);
      navigation.activate();
    }
    if (controls.fullscreen) {
      var fullscreen = $('a.map-fullscreen', map).click(function() {
        $(map).toggleClass('fullscreen');
        olMap.updateSize();
        return false;
      });
    }
    if (controls.zoom) {
      function getZoom(e) {
        if ($('#zoom-display', map).size()) {
          $('#zoom-display', map).text('Zoom level ' + olMap.getZoom());
        }
      }
      getZoom();
      olMap.events.register("moveend", olMap, getZoom);
      olMap.events.register("zoomend", olMap, getZoom);
    }
    if (controls.panzoombar) {
      var panzoombar = new OpenLayers.Control.PanZoomBar();
      openlayers.map.addControl(panzoombar);
      panzoombar.activate();
    }

    // Store data on the map object.
    map.data('TileMill.map', {olMap: olMap, olLayer: olLayer});
  }
  else {
    var olMap = map.data('TileMill.map').olMap;
    var olLayer = map.data('TileMill.map').olLayer;
    olMap.removeLayer(olLayer);
    olLayer = new OpenLayers.Layer.XYZ("Preview", servers);
    olMap.addLayers([olLayer]);
  }
};
