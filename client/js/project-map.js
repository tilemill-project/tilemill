// MapView
// -------
// OpenLayers map preview for a project.
var MapView = Backbone.View.extend({
    id: 'MapView',
    initialize: function() {
        _.bindAll(this, 'render', 'activate', 'controlZoom', 'reload',
            'legend', 'fullscreen', 'minimize', 'maximize');

        // OpenLayers seems to fiercely associate maps with DOM element IDs.
        // Using a stable ID means that if it appears again (e.g. the project
        // is closed and reopened) OpenLayers will retain its attachment, even
        // to a freshly created DOM element. Workaround is to generate a
        // "unique" `this.mapID` to ensure a fresh OL map each time.
        this.mapID = +new Date;
        this.render();
        this.model.bind('save', this.reload);
        window.app.bind('ready', this.activate);
    },
    events: {
        'click a.map-fullscreen': 'fullscreen',
        'click a.map-legend': 'legend'
    },
    render: function() {
        $(this.el).html(ich.MapView({ id: this.mapID }));
    },
    activate: function() {
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
            controls: [
                new OpenLayers.Control.Navigation({ zoomWheelEnabled: true }),
                new wax.ol.Interaction(),
                new wax.ol.Legend()
            ]
        };

        // Retrieve stored centerpoint from model and convert to map units.
        var center = this.model.get('_center');
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

        this.map = new OpenLayers.Map('map-preview-' + this.mapID, options);
        this.layer = new OpenLayers.Layer.SignedTMS('Preview', window.app.baseURL(), {
            layername: this.model.id,
            type: this.model.get('_format'),
            buffer: 0,
            transitionEffect: 'resize',
            wrapDateLine: true,
            signature: this.model.get('_updated')
        });
        this.map.addLayers([this.layer]);

        // Set the map's initial center point
        this.map.setCenter(new OpenLayers.LonLat(center.lon, center.lat), center.zoom);

        this.controlZoom({element: this.map.div});
        this.map.events.register('moveend', this.map, this.controlZoom);
        this.map.events.register('zoomend', this.map, this.controlZoom);

        // Stop event propagation to the OL map.
        this.$('.control a').mousedown(function(e) {
            e.stopPropagation();
        });
        this.$('.control a').mouseup(function(e) {
            e.stopPropagation();
        });
        this.$('a.zoom-in').click($.proxy(function(e) {
            e.stopPropagation();
            this.map.zoomIn();
            return false;
        }, this));
        this.$('a.zoom-out').click($.proxy(function(e) {
            e.stopPropagation();
            this.map.zoomOut();
            return false;
        }, this));

        return this;
    },
    legend: function() {
        this.$('a.map-legend').toggleClass('active');
        $(this.el).toggleClass('legend');
        return false;
    },
    fullscreen: function() {
        this.$('a.map-fullscreen').toggleClass('active');
        $(this.el).toggleClass('fullscreen');
        this.map.updateSize();
        return false;
    },
    maximize: function() {
        this.$('a.map-fullscreen').addClass('active');
        $(this.el).addClass('fullscreen');
        this.map.updateSize();
        return false;
    },
    minimize: function() {
        this.$('a.map-fullscreen').removeClass('active');
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
        center = { lat: lonlat.lat, lon: lonlat.lon, zoom: zoom };
        this.model.set({ _center: center }, { silent: true });

        this.$('.zoom-display .zoom').text(this.map.getZoom());
    },
    reload: function() {
        if (this.map.layers && this.map.layers && this.map.layers[0]) {
            this.map.layers[0].type = this.model.get('_format');
            this.map.layers[0].signature = this.model.get('_updated');
            this.map.layers[0].redraw();
            this.map.events.triggerEvent('changelayer', {
                layer: this.map.layers[0],
                property: 'visibility'
            });
        }
    }
});

// Extend OpenLayers.Layer.TMS to allow for a query-string signed URL based
// on the last updated time of the project.
OpenLayers.Layer.SignedTMS = OpenLayers.Class(OpenLayers.Layer.TMS, {
    getURL: function (bounds) {
        var url = OpenLayers.Layer.TMS.prototype.getURL.call(this, bounds);
        (this.signature) && (url += '?updated=' + this.signature);
        return url;
    }
});
