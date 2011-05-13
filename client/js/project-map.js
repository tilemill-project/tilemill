// MapView
// -------
// Map preview for a project.
var MapView = Backbone.View.extend({
    id: 'MapView',
    initialize: function() {
        _.bindAll(this, 'render', 'activate', 'controlZoom', 'reload',
            'legend', 'fullscreen', 'minimize', 'maximize');

        this.render();
        this.model.bind('save', this.reload);
        window.app.bind('ready', this.activate);
    },
    events: {
        'click a.map-fullscreen': 'fullscreen',
        'click a.map-legend': 'legend'
    },
    render: function() {
        $(this.el).html(ich.MapView());
    },
    activate: function() {
        window.app.unbind('ready', this.activate);
        var mm = com.modestmaps;
        this.map = new mm.Map('map-preview',
            new com.modestmaps.SignedProvider({
                baseUrl: window.app.baseURL(),
                filetype: '.' + this.model.get('_format'),
                zoomRange: [0, 22],
                signature: this.model.get('_updated'),
                layerName: this.model.id}))
            .interaction()
            .legend()
            .zoomer()
            .zoombox()
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
        if (this.map) {
            this.map.provider.filetype = '.' + this.model.get('_format');
            this.map.provider.signature = this.model.get('_updated');
            this.map.setProvider(this.map.provider);
        }
    }
});

// Extend Modest Maps WaxProvider to allow for a query-string signed URL based
// on the last updated time of the project.
if (!com) {
    var com = { };
    if (!com.modestmaps) {
        com.modestmaps = { };
    }
}

com.modestmaps.SignedProvider = function(options) {
    this.layerName = options.layerName;
    this.baseUrls = (typeof(options.baseUrl) == 'string') ?
            [options.baseUrl] : options.baseUrl;
    this.n_urls = this.baseUrls.length;
    this.filetype = options.filetype || '.png';
    this.zoomRange = options.zoomRange || [0, 18];
    this.signature = options.signature || null;
};

com.modestmaps.SignedProvider.prototype = {
    getTileUrl: function(coord) {
        var server;
        coord = this.sourceCoordinate(coord);
        if (!coord) {
            return null;
        }

        var worldSize = Math.pow(2, coord.zoom);
        coord.row = Math.pow(2, coord.zoom) - coord.row - 1;
        if (this.n_urls === 1) {
            server = this.baseUrls[0];
        } else {
            server = this.baseUrls[parseInt(worldSize * coord.row + coord.column, 10) % this.n_urls];
        }
        var imgPath = ['1.0.0', this.layerName, coord.zoom, coord.column, coord.row].join('/');
        var url = server + imgPath + this.filetype;
        (this.signature) && (url += '?updated=' + this.signature);
        return url;
    }
};

com.modestmaps.extend(com.modestmaps.SignedProvider, com.modestmaps.WaxProvider);
