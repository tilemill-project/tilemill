view = Backbone.View.extend();

view.prototype.events = {
    'click a.map-legend': 'mapLegend'
};

view.prototype.initialize = function() {
    _.bindAll(this,
        'render', 'reload',
        'mapInit', 'mapZoom'
    );
    this.render();
};

view.prototype.render = function() {
    $(this.el).html(templates.Project(this.model));
    this.mapInit();
    return this;
};

view.prototype.mapInit = function() {
    this.map = new com.modestmaps.Map('map',
        new wax.mm.signedProvider({
            baseUrl: '/',
            filetype: '.' + this.model.get('_format'),
            zoomRange: [0, 22],
            signature: this.model.get('_updated'),
            layerName: this.model.id}));

    wax.mm.interaction(this.map);
    wax.mm.legend(this.map);
    wax.mm.zoomer(this.map);
    wax.mm.zoombox(this.map);
    wax.mm.fullscreen(this.map);

    var center = this.model.get('_center');
    this.map.setCenterZoom(
        new com.modestmaps.Location(center.lat, center.lon),
        center.zoom);
    this.map.addCallback('zoomed', this.mapZoom);
    this.map.addCallback('panned', this.mapZoom);
    this.mapZoom({element: this.map.div});
};

view.prototype.mapZoom = function(e) {
    // Set the model center whenever the map is moved.
    var center = this.map.getCenter();
    center = { lat: center.lat, lon: center.lon, zoom: this.map.getZoom() };
    this.model.set({ _center: center }, { silent: true });
    this.$('.zoom-display .zoom').text(this.map.getZoom());
};

view.prototype.mapLegend = function() {
    this.$('a.map-legend').toggleClass('active');
    $(this.el).toggleClass('legend');
    return false;
};

view.prototype.reload = function() {
    if (this.map) {
        this.map.provider.filetype = '.' + this.model.get('_format');
        this.map.provider.signature = this.model.get('_updated');
        this.map.setProvider(this.map.provider);
    }
};

