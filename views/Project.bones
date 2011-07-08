view = Backbone.View.extend();

view.prototype.events = {
    'click .tabs a': 'codeTab',
    'click .actions a[href=#save]': 'save',
    'click a[href=#fonts]': 'fonts',
    'click a[href=#carto]': 'carto'
};

view.prototype.initialize = function() {
    _(this).bindAll('render', 'attach', 'save', 'mapZoom', 'codeTab', 'fonts', 'carto');
    this.render().trigger('attach');
};

view.prototype.render = function() {
    $(this.el).html(templates.Project(this.model));

    _(function mapInit () {
        if (!com.modestmaps) throw new Error('ModestMaps not found.');
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
    }).bind(this)();

    _(function codeInit() {
        if (!CodeMirror) throw new Error('CodeMirror not found.');
        var codeEl = this.$('.code').get(0);
        this.model.get('Stylesheet').each(_(function(model, index) {
            model.codemirror = CodeMirror(codeEl, {
                value: model.get('data'),
                lineNumbers: true,
                tabMode: 'shift',
                mode: {
                    name: 'carto',
                    reference: window.cartoReference
                },
                onCursorActivity: function() {
                    model.set({'data': model.codemirror.getValue()});
                },
                onChange: function() {
                    // onchange runs before this function is finished,
                    // so self.codemirror is false.
                    model.codemirror && model.set({'data': model.codemirror.getValue()});
                }
            });
            if (index === 0) $(model.codemirror.getWrapperElement()).addClass('active');
        }).bind(this));
    }).bind(this)();

    return this;
};

view.prototype.codeTab = function(e) {
    var id = $(e.currentTarget).attr('href').split('#').pop();
    var model = this.model.get('Stylesheet').get(id);
    $(model.codemirror.getWrapperElement()).addClass('active').siblings().removeClass('active');
    this.$('.tabs li a').removeClass('active');
    $(e.currentTarget).addClass('active');
    return false;
};

// Set the model center whenever the map is moved.
view.prototype.mapZoom = function(e) {
    var center = this.map.getCenter();
    center = { lat: center.lat, lon: center.lon, zoom: this.map.getZoom() };
    this.model.set({ _center: center }, { silent: true });
    this.$('.zoom-display .zoom').text(this.map.getZoom());
};

// @TODO.
view.prototype.mapLegend = function() {
    this.$('a.map-legend').toggleClass('active');
    $(this.el).toggleClass('legend');
    return false;
};

view.prototype.attach = function() {
    _(function map() {
        this.map.provider.filetype = '.' + this.model.get('_format');
        this.map.provider.signature = this.model.get('_updated');
        this.map.setProvider(this.map.provider);
    }).bind(this)();

    // Rescan stylesheets for colors, dedupe, sort by luminosity
    // and render swatches for each one.
    _(function swatches() {
        this.$('.colors span.swatch').remove();
        _(this.model.get('Stylesheet').pluck('data').join('\n')
            .match(/\#[A-Fa-f0-9]{6}\b|\#[A-Fa-f0-9]{3}\b|\b(rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0?\.)?\d+\s*\))/g) || []
        ).chain()
            .uniq(true)
            .sortBy(function(c) {
                var x = function(i, size) {
                    return parseInt(c.substr(i, size), 16)
                        / (Math.pow(16, size) - 1);
                };
                if (c[0] === '#' && c.length == 7) {
                    return x(1, 2) + x(3, 2) + x(5, 2);
                } else if (c[0] === '#' && c.length == 4) {
                    return x(1, 1) + x(2, 1) + x(3, 1);
                } else {
                    var matches = c.match(/\d+/g);
                    return matches[0]/255 + matches[1]/255 + matches[2]/255;
                }
            })
            .each(_(function(color) {
                var swatch = _('<span class="swatch"><span  style="background-color:<%= color %>" class="color"></span></span>').template({color:color})
                this.$('.colors').append(swatch);
            }).bind(this));
    }).bind(this)();
};

view.prototype.save = function() {
    this.model.save(this.model.attributes, {
        success: _(function(model, resp) {
            this.attach();
        }).bind(this),
        error: function(model, resp) {
            console.log(resp);
        }
    });
    return false;
};

view.prototype.fonts = function(ev) {
    new views.Fonts({ el: $('#drawer') });
};

view.prototype.carto = function(ev) {
    new views.Reference({ el: $('#drawer') });
};

