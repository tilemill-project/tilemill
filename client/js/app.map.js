var MapView = Backbone.View.extend({
    id: 'map-preview',
    initialize: function() {
        _.bindAll(this, 'render', 'activate', 'controlZoom', 'reload',
            'fullscreen', 'projectExport', 'minimize', 'maximize');
        this.render();
        this.model.bind('save', this.reload);
        this.model.bind('export', this.projectExport);
        window.app.bind('ready', this.activate);
    },
    events: {
        'click a.map-fullscreen': 'fullscreen'
    },
    render: function() {
        $(this.el).html(ich.MapView({ id: this.model.id }));
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
            numZoomLevels: 23,
            maxResolution: 156543.0339,
            maxExtent: new OpenLayers.Bounds(
                -20037500,
                -20037500,
                20037500,
                20037500
            ),
            controls: []
        };

        // Retrieve stored centerpoint from model and convert to map units.
        var center = this.model.get('center') || {lat: 0, lon: 0, zoom: 2};
        var lonlat = new OpenLayers.LonLat(center.lon, center.lat)
        lonlat.transform(
            new OpenLayers.Projection('EPSG:4326'),
            new OpenLayers.Projection('EPSG:900913')
        );
        center.lat = lonlat.lat;
        center.lon = lonlat.lon;

        // Nav control images.
        // @TODO: Store locally so the application is portable/usable offline?
        OpenLayers.ImgPath = 'images/openlayers_dark/';

        this.map = new OpenLayers.Map('map-preview-' + this.model.id, options);
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

        $('#zoom-display .zoom-in').click($.proxy(function() {
            this.map.zoomIn();
        }, this));

        $('#zoom-display .zoom-out').click($.proxy(function() {
            this.map.zoomOut();
        }, this));

        return this;
    },

    fullscreen: function() {
        if ($(this.el).hasClass('fullscreen')) {
            this.minimize();
        } else {
            this.maximize();
        }
        return false;
    },

    projectExport: function(view) {
        this.maximize();
        var selections_layer = new OpenLayers.Layer.Vector('Temporary Box Layer');
        view.trigger('bbox',
            this.map.getExtent().transform(
                this.map.projection,
                new OpenLayers.Projection('EPSG:4326')
            ).toArray()
        );
        control = new OpenLayers.Control.DrawFeature(
            selections_layer,
            OpenLayers.Handler.RegularPolygon,
            {
                featureAdded: function(box) {
                    var boundingBox = box.geometry.getBounds().transform(
                        box.layer.map.projection,
                        new OpenLayers.Projection('EPSG:4326')).toArray();
                    view.trigger('bbox', boundingBox);
                    for(i = 0; i < selections_layer.features.length; i++) {
                        if(selections_layer.features[i] != box) {
                            selections_layer.features[i].destroy();
                        }
                    }
                    // TODO: Determine pixel dimmensions of box.
                }
            }
        );
        control.handler.setOptions({
            'keyMask': OpenLayers.Handler.MOD_ALT,
            'sides': 4,
            'irregular': true
        });
        this.map.addLayer(selections_layer);
        this.map.addControl(control);
        control.activate();
    },

    maximize: function() {
        $(this.el).addClass('fullscreen');
        this.map.updateSize();
        return false;
    },

    minimize: function() {
        $(this.el).removeClass('fullscreen');
        this.map.updateSize();
        return false;
    },

    controlZoom: function(e) {
        // Set the model center whenever the map is moved.
        // Retrieve centerpoint from map and convert to lonlat units.
        var center = this.map.getCenter();
        var zoom = this.map.getZoom();
        var lonlat = new OpenLayers.LonLat(center.lon, center.lat);
        lonlat.transform(
            this.map.projection,
            new OpenLayers.Projection("EPSG:4326")
        );
        this.model.set({
            center: {
                lat: lonlat.lat,
                lon: lonlat.lon,
                zoom: zoom
            }
        },
        {
            silent: true
        });

        (e.element.id && $('#zoom-display h4', e.element).size()) &&
            $('#zoom-display h4', e.element)
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

