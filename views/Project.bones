view = Backbone.View.extend();

view.prototype.events = {
    'click .actions a[href=#save]': 'save',
    'click .actions a[href=#export-pdf]': 'exportAdd',
    'click .actions a[href=#export-png]': 'exportAdd',
    'click .actions a[href=#export-mbtiles]': 'exportAdd',
    'click .actions a[href=#exports]': 'exportList',
    'click #export input.cancel': 'exportCancel',
    'click a[href=#fonts]': 'fonts',
    'click a[href=#carto]': 'carto',
    'click a[href=#settings]': 'settings',
    'click .layers a.add': 'layerAdd',
    'click .layers a.edit': 'layerEdit',
    'click .layers a.inspect': 'layerInspect',
    'click .layers a.delete': 'layerDelete',
    'click .editor a.add': 'stylesheetAdd',
    'click .editor a.delete': 'stylesheetDelete',
    'keydown': 'keydown'
};

view.prototype.initialize = function() {
    _(this).bindAll(
        'render',
        'attach',
        'save',
        'mapZoom',
        'keydown',
        'layerAdd',
        'layerInspect',
        'layerEdit',
        'layerDelete',
        'makeLayer',
        'makeStylesheet',
        'stylesheetAdd',
        'stylesheetDelete',
        'exportAdd',
        'exportList',
        'exportCancel'
    );
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

    _(function stylesheetInit() {
        this.model.get('Stylesheet').each(this.makeStylesheet);
    }).bind(this)();

    _(function layerInit() {
        this.model.get('Layer').each(this.makeLayer);
    }).bind(this)();

    return this;
};

view.prototype.makeLayer = function(model) {
    model.el = $(templates.ProjectLayer(model));
    this.$('.layers ul').append(model.el);

    // Bind to the 'remove' event to teardown.
    model.bind('remove', _(function(model) {
        model.el.remove();
    }).bind(this));
};

view.prototype.makeStylesheet = function(model) {
    if (!CodeMirror) throw new Error('CodeMirror not found.');
    var codeEl = this.$('.code').get(0);
    var id = 'stylesheet-' + model.id.replace(/[\.]/g, '-');
    model.el = $(templates.ProjectStylesheet(model));
    model.codemirror = CodeMirror(codeEl, {
        value: model.get('data'),
        lineNumbers: true,
        tabMode: 'shift',
        mode: {
            name: 'carto',
            reference: window.abilities.carto
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
    $(model.codemirror.getWrapperElement())
        .addClass(id)
        .addClass(model.collection.indexOf(model) === 0 ? 'active' : '');
    this.$('.editor ul').append(model.el);

    // Bind to the 'remove' event to teardown.
    model.bind('remove', _(function(model) {
        model.el.remove();
        $(model.codemirror.getWrapperElement()).remove();
        this.$('.tabs a.tab:last').click();
    }).bind(this));
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
                var swatch = templates.ProjectSwatch({color:color});
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

view.prototype.settings = function(ev) {
    new views.Settings({ el: $('#popup') });
};

view.prototype.keydown = function(ev) {
    // ctrl+S
    if (ev.which == 83 &&
        ((ev.ctrlKey || ev.metaKey) && !ev.altKey)) {
        this.save();
        return false;
    }
};

view.prototype.layerAdd = function(ev) {
    var model = new models.Layer({}, {
        collection: this.model.get('Layer')
    })
    model.bind('add', this.makeLayer);
    new views.Layer({
        el: $('#popup'),
        model: model
    });
};

view.prototype.layerEdit = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    new views.Layer({
        el: $('#popup'),
        model: this.model.get('Layer').get(id)
    });
};

view.prototype.layerDelete = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    new views.Modal({
        content: 'Are you sure you want to delete layer "'+ id +'"?',
        callback: _(function() {
            var model = this.model.get('Layer').get(id);
            this.model.get('Layer').remove(model);
        }).bind(this)
    });
    return false;
};

view.prototype.layerInspect = function(ev) {
    $('#drawer').addClass('loading');
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    var layer = this.model.get('Layer').get(id);
    var model = new models.Datasource(_.extend(
        {
            id: layer.get('id'),
            project: this.model.get('id')
        },
        layer.get('Datasource')
    ));
    model.fetchFeatures({
        success: function(model) {
            new views.DatasourceInfo({
                el: $('#drawer'),
                model: model
            });
        },
        error: function(err) {
            // TODO
            console.log(err);
        }
    });
};

view.prototype.stylesheetAdd = function(ev) {
    var model = new models.Stylesheet({}, {
        collection: this.model.get('Stylesheet')
    });
    model.bind('add', this.makeStylesheet);
    new views.Stylesheet({el:$('#popup'), model:model});
};

view.prototype.stylesheetDelete = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    new views.Modal({
        content: 'Are you sure you want to delete stylesheet "' + id + '"?',
        callback: _(function() {
            var model = this.model.get('Stylesheet').get(id);
            this.model.get('Stylesheet').remove(model);
        }).bind(this)
    });
};

view.prototype.exportAdd = function(ev) {
    var target = $(ev.currentTarget);
    var type = target.attr('href').split('#export-').pop();
    this.$('.project').addClass('exporting');
    this.$('#export > .title').text(target.attr('title'));
    new views.Export({
        el: $('#export'),
        type: type,
        model: this.model
    });
};

view.prototype.exportCancel = function(ev) {
    this.$('.project').removeClass('exporting');
    return false;
};

view.prototype.exportList = function(ev) {
    $('#drawer').addClass('loading');
    var collection = new models.Exports();
    collection.fetch({
        success: function() {
            $('#drawer').removeClass('loading');
            new views.Exports({
                collection: collection,
                el: $('#drawer')
            });
        },
        error: function(m, e) {
            $('#drawer').removeClass('loading');
            new views.Modal(e);
        }
    });
};

