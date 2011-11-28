view = Backbone.View.extend();

view.prototype.events = {
    'click .actions a[href=#save]': 'save',
    'click .actions a[href=#export-pdf]': 'exportAdd',
    'click .actions a[href=#export-svg]': 'exportAdd',
    'click .actions a[href=#export-png]': 'exportAdd',
    'click .actions a[href=#export-mbtiles]': 'exportAdd',
    'click .actions a[href=#exports]': 'exportList',
    'click a[href=#fonts]': 'fonts',
    'click a[href=#carto]': 'carto',
    'click a[href=#settings]': 'settings',
    'click .layers a.add': 'layerAdd',
    'click .layers a.edit': 'layerEdit',
    'click .layers a.inspect': 'layerInspect',
    'click .layers a.delete': 'layerDelete',
    'click .editor a.add': 'stylesheetAdd',
    'click .editor a.delete': 'stylesheetDelete',
    'sortupdate .layers ul': 'sortLayers',
    'sortupdate .tabs': 'sortStylesheets',
    'click .status a[href=#close]': 'statusClose',
    'click .swatch': 'colorOpen',
    'click .swatch a[href=#save]': 'colorSave',
    'click .swatch a[href=#close]': 'colorClose',
    'click .breadcrumb .logo': 'unload'
};

view.prototype.initialize = function() {
    _(this).bindAll(
        'render',
        'attach',
        'save',
        'change',
        'mapZoom',
        'layerAdd',
        'layerInspect',
        'layerEdit',
        'layerDelete',
        'makeLayer',
        'makeStylesheet',
        'stylesheetAdd',
        'stylesheetDelete',
        'sortLayers',
        'sortStylesheets',
        'exportAdd',
        'exportList',
        'statusClose',
        'colors',
        'colorOpen',
        'colorSave',
        'colorClose',
        'unload'
    );
    Bones.intervals = Bones.intervals || {};
    if (Bones.intervals.project) clearInterval(Bones.intervals.project);
    Bones.intervals.project = setInterval(_(function() {
        this.model.poll({ error: function(m, err) {
            new views.Modal(err);
            clearInterval(Bones.intervals.project);
        }});
    }).bind(this), 1000);

    window.onbeforeunload = window.onbeforeunload || this.unload;

    this.model.bind('save', this.attach);
    this.model.bind('change', this.change);
    this.model.bind('poll', this.render);
    this.model.bind('poll', this.attach);
    this.render(true).attach();
};

view.prototype.render = function(init) {
    if (init === true) {
        $(this.el).html(templates.Project(this.model));

        if (!com.modestmaps) throw new Error('ModestMaps not found.');
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

        var center = this.model.get('center');
        this.map.setCenterZoom(new com.modestmaps.Location(
            center[1],
            center[0]),
            center[2]);
        this.map.addCallback('zoomed', this.mapZoom);
        this.map.addCallback('panned', this.mapZoom);
        this.map.addCallback('extentset', this.mapZoom);
        this.mapZoom({element: this.map.div});
    }
    this.$('.tabs').empty();
    this.$('.code').empty();
    this.$('.layers ul').empty();

    this.model.get('Stylesheet').chain().each(this.makeStylesheet);
    this.$('.tabs').sortable({
        axis: 'x',
        containment: 'parent',
        tolerance: 'pointer'
    });

    this.model.get('Layer').chain().each(this.makeLayer);
    this.$('.layers ul').sortable({
        axis: 'y',
        handle: '.handle',
        containment: this.$('.layers'),
        tolerance: 'pointer'
    });

    return this;
};

view.prototype.makeLayer = function(model) {
    model.el = $(templates.ProjectLayer(model));

    // Prepend layers since intuitively the last drawn layer appears
    // "on top" of the other layers (painting model).
    this.$('.layers ul').prepend(model.el);

    // Bind to the 'remove' event to teardown.
    model.bind('remove', _(function(model) {
        model.el.remove();
    }).bind(this));
    // Bind change event to retemplate.
    model.bind('change', _(function(model) {
        var update = $(templates.ProjectLayer(model));
        model.el.replaceWith(update);
        model.el = update;
    }).bind(this));
};

view.prototype.makeStylesheet = function(model) {
    if (!CodeMirror) throw new Error('CodeMirror not found.');
    var codeEl = this.$('.code').get(0),
        self = this,
        id = 'stylesheet-' + model.id.replace(/[\.]/g, '-');
    model.el = $(templates.ProjectStylesheet(model));
    model.codemirror = CodeMirror(codeEl, {
        value: model.get('data'),
        lineNumbers: true,
        tabMode: 'shift',
        mode: {
            name: 'carto',
            reference: window.abilities.carto,
            onColor: this.colors
        },
        onCursorActivity: function() {
            model.set({'data': model.codemirror.getValue()});
        },
        onChange: function() {
            // onchange runs before this function is finished,
            // so self.codemirror is false.
            model.codemirror && model.set({
                data: model.codemirror.getValue()
            });
            self.colors();
        },
        onGutterClick: _(function(editor, line, ev) {
            if (model.errors[line]) {
                this.$('.status').addClass('active');
                this.$('.status .content').text(model.errors[line]);
                return false;
            }
        }).bind(this)
    });

    var cartoCompleter = cartoCompletion(model.codemirror, window.abilities.carto);

    function updateSelectors(model) {
        var ids = _.map(model.get('Layer').pluck('id'), function(x) { return '#' + x; });
        var classes = _(model.get('Layer').pluck('class')).chain().map(
            function(c) {
                if (c == undefined) return '';
                var cs = c.split(' ');
                if (cs[0] == '') return '';
                return _.map(cs, function(x) { return '.' + x; });
            }).flatten().compact().value();
        cartoCompleter.ids(ids);
        cartoCompleter.classes(classes);
    }

    this.model.bind('change', updateSelectors);
    updateSelectors(this.model);

    model.codemirror.setOption('onKeyEvent',
        cartoCompleter.onKeyEvent);

    model.codemirror.setOption('onHighlightComplete',
        _.throttle(cartoCompleter.setTitles, 100));

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
    var zoom = this.map.getZoom();
    var lat = this.map.getCenter().lat;
    var lon = this.map.getCenter().lon % 360;
    if (lon < -180) lon += 360; else if (lon > 180) lon -= 360;

    this.model.set({center:[lon, lat, zoom]}, {silent:true});
    this.$('.zoom-display .zoom').text(this.map.getZoom());
};

view.prototype.attach = function() {
    // Reset various portions of the UI.
    this.$('.actions a[href=#save]').addClass('disabled');
    this.statusClose();

    // @TODO Currently interaction formatter/data is cached
    // deep in Wax making it difficult to update without simply
    // creating a new map. Likely requires an upstream fix.
    this.map.provider.options.tiles = this.model.get('tiles');
    this.map.provider.options.minzoom = this.model.get('minzoom');
    this.map.provider.options.maxzoom = this.model.get('maxzoom');
    this.map.setProvider(this.map.provider);

    this.map.controls.interaction.remove();
    this.map.controls.interaction = wax.mm.interaction(this.map, this.model.attributes);

    if (this.model.get('legend')) {
        this.map.controls.legend.content(this.model.attributes);
        this.map.controls.legend.appendTo(this.map.parent);
    } else {
        $(this.map.controls.legend.element()).remove();
    }

    this.colors();
};

view.prototype.change = function() {
    this.$('.actions a[href=#save]').removeClass('disabled');
};

view.prototype.save = function(ev) {
    if (this.$('.actions a[href=#save]').is('.disabled')) return false;

    this.model.get('Stylesheet').forEach(function(model) {
        if (model.errors) {
            model.errors = [];
            for (i = 0; i < model.codemirror.getValue().match(/\n/g).length+1; i++) {
                model.codemirror.clearMarker(i);
            }
        }
    });
    this.$('.tabs a.error').removeClass('error');

    $(this.el).addClass('saving');
    this.model.save(this.model.attributes, {
        success: _(function(model) {
            $(this.el).removeClass('saving');
            model.trigger('save');
        }).bind(this),
        // Test for a Carto error of the form
        //
        //     style.mss:2 Invalid value for background-color ...
        //
        // and highlight the line number and stylesheet appropriately if
        // found. Otherwise, display error in a modal.
        error: _(function(model, err) {
            $(this.el).removeClass('saving');
            if (err.responseText) err = JSON.parse(err.responseText).message;
            var err = _(err.toString().split('\n')).compact();
            for (var i = 0; i < err.length; i++) {
                var match = err[i].match(/^(Error: )?([\w.]+):([\d]+):([\d]+) (.*)$/);
                if (match) {
                    var stylesheet = this.model.get('Stylesheet').get(match[2]),
                        id = 'stylesheet-' + stylesheet.id.replace(/[\.]/g, '-'),
                        lineNum = parseInt(match[3]) - 1;

                    this.$('.tabs a[href=#' + id + ']').addClass('error');
                    stylesheet.errors = stylesheet.errors || [];
                    stylesheet.errors[lineNum] = match[5];
                    stylesheet.codemirror.setMarker(lineNum, '%N%', 'error');
                } else {
                    new views.Modal(err[i]);
                    break;
                }
            }
        }).bind(this)
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
    new views.Settings({ el: $('#popup'), model: this.model });
};

view.prototype.layerAdd = function(ev) {
    var cb = _(function(favorites) {
        var model = new models.Layer({}, {
            collection: this.model.get('Layer')
        })
        model.bind('add', this.makeLayer);
        new views.Layer({
            el: $('#popup'),
            model: model,
            favorites: favorites
        });
    }).bind(this);
    (new models.Favorites).fetch({success:cb,error:cb});
};

view.prototype.layerEdit = function(ev) {
    var cb = _(function(favorites) {
        var id = $(ev.currentTarget).attr('href').split('#').pop();
        new views.Layer({
            el: $('#popup'),
            model: this.model.get('Layer').get(id),
            favorites: favorites
        });
    }).bind(this);
    (new models.Favorites).fetch({success:cb,error:cb});
};

view.prototype.layerDelete = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    new views.Modal({
        content: 'Are you sure you want to delete layer "'+ id +'"?',
        callback: _(function() {
            var model = this.model.get('Layer').get(id);
            this.model.get('Layer').remove(model);
        }).bind(this),
        affirmative: 'Delete'
    });
    return false;
};

view.prototype.layerInspect = function(ev) {
    $('#drawer .content').empty();
    $('#drawer').addClass('loading');
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    var layer = this.model.get('Layer').get(id);
    var model = new models.Datasource(_(layer.get('Datasource')).extend({
        id: layer.get('id'),
        project: this.model.get('id'),
        // millstone will not allow `srs` be undefined for inspection so we set
        // it to null. We could use the layer's SRS, but this likely has fewer
        // side effects.
        srs: null
    }));
    model.fetchFeatures({
        success: function(model) {
            $('#drawer').removeClass('loading');
            new views.Datasource({
                el: $('#drawer'),
                model: model
            });
        },
        error: function(model, err) {
            $('#drawer').removeClass('loading');
            new views.Modal(err);
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
        }).bind(this),
        affirmative: 'Delete'
    });
};

view.prototype.sortLayers = function() {
    var order = _(this.$('.layers li .actions a')).chain()
        .map(function(el) { return $(el).attr('href').split('#').pop(); })
        .uniq()
        .reverse()
        .value();
    this.model.get('Layer').models = this.model.get('Layer')
        .sortBy(function(model) { return _(order).indexOf(model.id) });
    this.model.get('Layer').trigger('change');
};

view.prototype.sortStylesheets = function() {
    var order = _(this.$('.tabs li a.delete')).chain()
        .map(function(el) { return $(el).attr('href').split('#').pop(); })
        .uniq()
        .value();
    this.model.get('Stylesheet').models = this.model.get('Stylesheet')
        .sortBy(function(model) { return _(order).indexOf(model.id) });
    this.model.get('Stylesheet').trigger('change');
};

view.prototype.exportAdd = function(ev) {
    var target = $(ev.currentTarget);
    var format = target.attr('href').split('#export-').pop();

    this.map.controls.fullscreen.full();
    this.$('.project').addClass('exporting');
    this.$('#export > .title').text(target.attr('title'));
    this.exportView = new views.Export({
        el: $('#export'),
        map: this.map,
        model: new models.Export({
            format: format,
            project: this.model.id,
            tile_format: this.model.get('format')
        }),
        project: this.model,
        success: _(function() {
            this.exportView.remove();
            this.$('.project').removeClass('exporting');
            this.map.controls.fullscreen.original();

            // @TODO better API for manipulating UI elements.
            if (!$('#drawer').is('.active')) {
                $('a[href=#exports]').click();
                $('.actions > .dropdown').click();
            }
            this.exportList();
        }).bind(this),
        error: _(function(m, err) {
            new views.Modal(err);
        }).bind(this),
        cancel: _(function() {
            this.exportView.remove();
            this.$('.project').removeClass('exporting');
            this.map.controls.fullscreen.original();
        }).bind(this)
    });
};

// Create a global reference to the exports collection on the Bones
// object. Ensures that export polling only ever occurs against one
// collection.
view.prototype.exportList = function(ev) {
    $('#drawer').addClass('loading');
    Bones.models = Bones.models || {};
    Bones.models.exports = Bones.models.exports || new models.Exports();
    Bones.models.exports.fetch({
        success: function(collection) {
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

view.prototype.statusClose = function(ev) {
    this.$('.status').removeClass('active');
    return false;
};

view.prototype.css2rgb = function(c) {
    var x = function(i, size) {
        return Math.round(parseInt(c.substr(i, size), 16)
            / (Math.pow(16, size) - 1) * 255);
    };
    if (c[0] === '#' && c.length == 7) {
        return {R:x(1, 2), G:x(3, 2), B:x(5, 2)};
    } else if (c[0] === '#' && c.length == 4) {
        return {R:x(1, 1), G:x(2, 1), B:x(3, 1)};
    } else {
        var rgb = c.match(/\d+/g);
        return {R:rgb[0], G:rgb[1], B:rgb[2]};
    }
};

view.prototype.colorOpen = function(ev) {
    // Colorpicker uses canvas... disable in IE for now.
    if ($.browser.msie) return;

    if (this.$('#colorpicker').size()) return;

    var swatch = $(ev.currentTarget);
    $('body').addClass('overlay');
    this.$('.colors').addClass('active');
    var find = swatch.attr('title');
    var hsv = Color.RGB_HSV(this.css2rgb(find));
    var picker = $(templates.Colorpicker({find:find}));
    new Color.Picker({
        hue: hsv.H,
        sat: hsv.S,
        val: hsv.V,
        element: picker.get(0),
        callback: _(function(hex) {
            $('.color', swatch).css('backgroundColor', '#'+hex);
        }).bind(this)
    });
    swatch.append(picker);
};

view.prototype.colorSave = function(ev) {
    var swatch = $(ev.currentTarget).parents('.swatch');
    var from = $('input[name=find]', swatch).val();
    var to = $('.color', swatch).css('backgroundColor');
    if (from) {
        from = from.replace('(', '\\(').replace(')', '\\)');
        from = new RegExp(from, 'g');
        to = '#' + Color.HEX_STRING(Color.RGB_HEX(this.css2rgb(to)));
        this.model.get('Stylesheet').each(function(s) {
            var data = s.get('data').replace(from, to);
            s.set({ data: data });
            var lines = data.split("\n");
            s.codemirror.replaceRange(data, {line: 0, ch: 0}, {line: lines.length, ch: lines[lines.length - 1].length });
        });
        this.save();
    }
    $('body').removeClass('overlay');
    this.$('.colors').removeClass('active');
    this.$('#colorpicker').remove();
    return false;
};

view.prototype.colorClose = function(ev) {
    var swatch = $(ev.currentTarget).parents('.swatch');
    var from = $('input[name=find]', swatch).val();
    $('.color', swatch).css('backgroundColor', from);
    $('body').removeClass('overlay');
    this.$('.colors').removeClass('active');
    this.$('#colorpicker').remove();
    return false;
};

// This handler may be called from *anywhere* since we don't have a chance to
// unbind when handling the beforeunload event. Check that we are indeed on a
// project view when doing this.
view.prototype.unload = function(ev) {
    if (!$('.project').size()) return;
    if ($('.actions a.disabled[href=#save]').size()) return;
    if (ev.metaKey) return;

    var message = 'You have unsaved changes. Are you sure you want to close this project?';
    if (ev.type === 'beforeunload') return message;
    if (confirm(message)) return true;
    return false;
};

view.prototype.colorList = {};
view.prototype.colors = function(color) {
    if (color) {
        this.colorList[color] = true;
    }
    // Rescan stylesheets for colors, dedupe, sort by luminosity
    // and render swatches for each one.
    this.$('.colors').empty();
    _(this.model.get('Stylesheet').pluck('data').join('\n')
        .match(/\#[A-Fa-f0-9]{6}\b|\#[A-Fa-f0-9]{3}\b|\b(rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0?\.)?\d+\s*\))/g) || []
    ).chain()
        .uniq()
        .each(_(function(color) {
            if (color[0] != '#' || this.colorList[color]) {
                var swatch = templates.ProjectSwatch({ color: color});
                this.$('.colors').append(swatch);
            }
        }).bind(this));
}
