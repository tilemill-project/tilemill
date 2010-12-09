TileMill.map = {};

/**
 * Init and return markup.
 */
TileMill.map.init = function() {
  var map = $(TileMill.template('map', {}));
  return map;
};

/**
 * Init openlayers on a map element.
 */
TileMill.map.initOL = function(map, servers, controls, center) {
  var options = {
    projection: new OpenLayers.Projection('EPSG:900913'),
    displayProjection: new OpenLayers.Projection('EPSG:4326'),
    units: 'm',
    numZoomLevels: 18,
    maxResolution: 156543.0339,
    maxExtent: new OpenLayers.Bounds(
      -20037500,
      -20037500,
      20037500,
      20037500
    ),
    controls: []
  };
  center = center || {lat: 0, lon: 0, zoom: 2};

  // Nav control images.
  // @TODO: Store locally so the application is portable/usable offline?
  OpenLayers.ImgPath = 'images/openlayers_dark/';

  var olMap = new OpenLayers.Map(map.attr('id'), options);
  var olLayer = new OpenLayers.Layer.XYZ('Preview', servers, {
      buffer: 0,
      transitionEffect: 'resize'
  });
  olMap.addLayers([olLayer]);

  // Set the map's initial center point
  olMap.setCenter(new OpenLayers.LonLat(center.lon, center.lat), center.zoom);

  // Store data on the map object.
  map.data('TileMill.map', {
      olMap: olMap,
      olLayer: olLayer
  });

  // Add custom controls
  if (controls.navigation) {
    var navigation = new OpenLayers.Control.Navigation({
        zoomWheelEnabled: true
    });
    olMap.addControl(navigation);
    navigation.activate();
  }
  if (controls.fullscreen) {
    $('a.map-fullscreen', map).click(function() {
      $(map).toggleClass('fullscreen');
      olMap.updateSize();
      return false;
    });
  }
  if (controls.zoom) {
    TileMill.map.controlZoom({element: olMap.div});
    olMap.events.register('moveend', olMap, TileMill.map.controlZoom);
    olMap.events.register('zoomend', olMap, TileMill.map.controlZoom);
  }
  if (controls.panzoombar) {
    var panzoombar = new OpenLayers.Control.PanZoomBar();
    olMap.addControl(panzoombar);
    panzoombar.activate();
  }
  return map;
};

/**
 * Reload the map layers.
 */
TileMill.map.reload = function(map, servers) {
  var data = map.data('TileMill.map');
  if (data && data.olMap) {
    var olMap = data.olMap;
    if (olMap.layers && olMap.layers[0]) {
      olMap.layers[0].url = servers;
      olMap.layers[0].redraw();
    }
  }
};

/**
 * Retrieve the centerpoint and zoom for a map.
 */
TileMill.map.getCenter = function(map) {
  var data = map.data('TileMill.map');
  if (data && data.olMap) {
    var olMap = data.olMap;
    var center = olMap.getCenter();
    return {
        lat: center.lat,
        lon: center.lon,
        zoom: olMap.getZoom()
    };
  }
  return {
      lat: 0,
      lon: 0,
      zoom: 2
  };
};

/**
 * Zoom control event callback.
 */
TileMill.map.controlZoom = function(e) {
  if (e.element.id) {
    var map = $('#' + e.element.id);
    var data = map.data('TileMill.map');
    if (data && data.olMap) {
      var olMap = data.olMap;
      if ($('#zoom-display', map).size()) {
        $('#zoom-display', map).text('Zoom level ' + olMap.getZoom());
      }
    }
  }
};
