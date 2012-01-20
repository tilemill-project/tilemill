view = Backbone.View.extend();

view.prototype.initialize = function() {
    _(this).bindAll(
        'render',
        'attach',
        'mapZoom',
        'fullscreen'
    );
    this.model.bind('saved', this.attach);
    this.model.bind('poll', this.attach);
    this.render().attach();
};

view.prototype.render = function(init) {
    if (!MM) throw new Error('ModestMaps not found.');

    $(this.el).html(templates.Map());

    this.map = new MM.Map('map',
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
    this.map.getLayerAt(0).requestManager.addCallback('requesterror', _(function(manager, url) {
        $.ajax(url, { error: _(function(resp) {
            if (resp.responseText === this._error) return;
            this._error = resp.responseText;
            new views.Modal(resp);
        }).bind(this) });
    }).bind(this));

    var center = this.model.get('center');
    this.map.setCenterZoom(new MM.Location(
        center[1],
        center[0]),
        center[2]);
    this.map.addCallback('zoomed', this.mapZoom);
    this.map.addCallback('panned', this.mapZoom);
    this.map.addCallback('extentset', this.mapZoom);
    this.map.addCallback('resized', this.fullscreen);
    this.mapZoom({element: this.map.div});
    return this;
};

// Catch resize events and add a fullscreen class to the
// project element to handle visibility of components.
// Note that the wax fullscreen control sets a body class that
// we cannot use here as it can be stale (e.g. user routes away
// from a fullscreen'd map, leaving a stale class on the body).
view.prototype.fullscreen = function(e) {
    if (this.$('#map').hasClass('wax-fullscreen-map')) {
        $('div.project').addClass('fullscreen');
    } else {
        $('div.project').removeClass('fullscreen');
    }
};

// Set zoom display.
view.prototype.mapZoom = function(e) {
    this.$('.zoom-display .zoom').text(this.map.getZoom());
};

view.prototype.attach = function() {
    this._error = '';

    var layer = this.map.getLayerAt(0);
    layer.provider.options.tiles = this.model.get('tiles');
    layer.provider.options.minzoom = this.model.get('minzoom');
    layer.provider.options.maxzoom = this.model.get('maxzoom');
    layer.setProvider(layer.provider);

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

// Hook in to project view with an augment.
views.Project.augment({ render: function(p) {
    p.call(this);
    new views.Map({
        el:this.$('.map'),
        model:this.model
    });
    return this;
}});
