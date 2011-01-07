var MapView = Backbone.View.extend({
    id: 'map-preview',
    initialize: function() {
        _.bindAll(this, 'render', 'activate', 'controlZoom', 'reload');
        this.render();
        this.model.bind('save', this.reload);
        window.app.bind('ready', this.activate);
    },
    events: {
        'click a.map-fullscreen': 'fullscreen'
    },
    render: function() {
        $(this.el).html(ich.MapView());
    },
    activate: function() {
        var controls = {
            navigation: true,
            fullscreen: true,
            zoom: true,
            panzoombar: false
        };
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
        // @TODO set from project model.
        var center = center || {lat: 0, lon: 0, zoom: 2};

        // Nav control images.
        // @TODO: Store locally so the application is portable/usable offline?
        OpenLayers.ImgPath = 'images/openlayers_dark/';

        this.map = new OpenLayers.Map(this.id, options);
        var fullControls = new OpenLayers.Control.PanZoom();
        this.layer = new OpenLayers.Layer.XYZ('Preview', this.model.layerURL({signed: true}), {
            buffer: 0,
            transitionEffect: 'resize'
        });
        this.map.addLayers([this.layer]);

        // Set the map's initial center point
        this.map.setCenter(new OpenLayers.LonLat(center.lon, center.lat), center.zoom);

        // Add custom controls
        if (controls.navigation) {
            var navigation = new OpenLayers.Control.Navigation({
                zoomWheelEnabled: true
            });
            this.map.addControl(navigation);
            navigation.activate();
        }

        if (controls.zoom) {
            this.controlZoom({element: this.map.div});
            this.map.events.register('moveend', this.map, this.controlZoom);
            this.map.events.register('zoomend', this.map, this.controlZoom);
        }

        if (controls.panzoombar) {
            var panzoombar = new OpenLayers.Control.PanZoomBar();
            olMap.addControl(panzoombar);
            panzoombar.activate();
        }
        return this;
    },

    fullscreen: function() {
        $(this.el).toggleClass('fullscreen');
        this.map.updateSize();
        if ($(this.el).hasClass('fullscreen')) {
            fullControls = new OpenLayers.Control.PanZoom();
            this.map.addControls([fullControls]);
        } else {
            this.map.removeControl(fullControls);
        }
        return false;
    },

    controlZoom: function(e) {
        (e.element.id && $('#zoom-display', e.element).size()) &&
            $('#zoom-display', e.element)
                .text('Zoom level ' + this.map.getZoom());
    },

    reload: function() {
        if (this.map.layers && this.map.layers && this.map.layers[0]) {
            this.map.layers[0].url = this.model.layerURL({signed: true});
            this.map.layers[0].redraw();
        }
    }
});

/*
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
*/

