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
        window.app.unbind('ready', this.activate);
        var mm = com.modestmaps;
        this.map = new mm.Map('map-preview-' + this.mapID,
            new com.modestmaps.WaxProvider({
                baseUrl: window.app.baseURL(),
                layerName: this.model.id}))
            .interaction()
            .legend()
            .zoomer()
            .fullscreen();

        var center = this.model.get('_center');
        this.map.setCenterZoom(
            new com.modestmaps.Location(center.lat, center.lon),
            center.zoom);
        this.map.addCallback('zoomed', this.controlZoom);
        this.map.addCallback('panned', this.controlZoom);
        this.controlZoom({element: this.map.div});
    },
    legend: function() {
        this.$('a.map-legend').toggleClass('active');
        $(this.el).toggleClass('legend');
        return false;
    },
    controlZoom: function(e) {
        // Set the model center whenever the map is moved.
        var center = this.map.getCenter();
        center = { lat: center.lat, lon: center.lon, zoom: this.map.getZoom() };
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
    getURL: function(bounds) {
        var url = OpenLayers.Layer.TMS.prototype.getURL.call(this, bounds);
        (this.signature) && (url += '?updated=' + this.signature);
        return url;
    }
});
