view = Backbone.View.extend();

view.prototype.initialize = function() {
    _(this).bindAll(
        'render',
        'attach',
        'mapZoom'
    );
    this.model.bind('saved', this.attach);
    this.model.bind('poll', this.attach);
    this.render().attach();
};

view.prototype.render = function(init) {
    if (!com.modestmaps) throw new Error('ModestMaps not found.');

    $(this.el).html(templates.Map());

    this.map = new com.modestmaps.Map('map',
        new wax.mm.connector(this.model.attributes));

    // Add references to all controls onto the map object.
    // Allows controls to be removed later on.
    this.map.controls = {
        interaction: wax.mm.interaction(this.map, this.model.attributes),
        legend: wax.mm.legend(this.map, this.model.attributes),
        zoombox: wax.mm.zoombox(this.map),
        zoomer: wax.mm.zoomer(this.map).appendTo(this.map.parent),
        fullscreen: wax.mm.fullscreen(this.map).appendTo(this.map.parent)
    };

    // Add image error request handler. "Dedupes" image errors by
    // checking against last received image error so as to not spam
    // the user with the same errors message for every image request.
    this.map.requestManager.addCallback('requesterror', _(function(manager, url) {
        $.ajax(url, { error: _(function(resp) {
            if (resp.responseText === this._error) return;
            this._error = resp.responseText;
            new views.Modal(resp);
        }).bind(this) });
    }).bind(this));

    var center = this.model.get('center');
    this.map.setCenterZoom(new com.modestmaps.Location(
        center[1],
        center[0]),
        center[2]);
    this.map.addCallback('zoomed', this.mapZoom);
    this.map.addCallback('panned', this.mapZoom);
    this.map.addCallback('extentset', this.mapZoom);
    this.mapZoom({element: this.map.div});
    return this;
};

// Set the model center whenever the map is moved.
view.prototype.mapZoom = function(e) {
    var zoom = this.map.getZoom();
    var lat = this.map.getCenter().lat;
    var lon = this.map.getCenter().lon % 360;
    if (lon < -180) lon += 360; else if (lon > 180) lon -= 360;

    this.model.set({center:[lon, lat, zoom]}, {silent:true});
    this.$('.zoom-display .zoom').text(this.map.getZoom());
};

view.prototype.attach = function() {
    this._error = '';

    // @TODO Currently interaction formatter/data is cached
    // deep in Wax making it difficult to update without simply
    // creating a new map. Likely requires an upstream fix.
    this.map.provider.options.tiles = this.model.get('tiles');
    this.map.provider.options.minzoom = this.model.get('minzoom');
    this.map.provider.options.maxzoom = this.model.get('maxzoom');
    this.map.setProvider(this.map.provider);

    this.map.controls.interaction.remove();
    this.map.controls.interaction = wax.mm.interaction(
        this.map,
        this.model.attributes);

    if (this.model.get('legend')) {
        this.map.controls.legend.content(this.model.attributes);
        this.map.controls.legend.appendTo(this.map.parent);
    } else {
        $(this.map.controls.legend.element()).remove();
    }
};

// Hook in to projet view with an augment.
views.Project.augment({ render: function(p) {
    p.call(this);
    new views.Map({
        el:this.$('.map'),
        model:this.model
    });
    return this;
}});
