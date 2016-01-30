view = Backbone.View.extend();

view.prototype.events = {
    'click input[type=submit]': 'save',
    'click a[href=#open]': 'browse',
    'click a[href=#favorite]': 'favoriteToggle',
    'keyup input[name$=file], input[name=connection]': 'favoriteUpdate',
    'change input[name$=file], input[name=connection]': 'favoriteUpdate',
    'keyup input[name$=file], .layer-postgis textarea': 'placeholderUpdate',
    'change input[name$=file], .layer-postgis textarea': 'placeholderUpdate',
    'click a[href=#cacheFlush]': 'cacheFlush',
    'change select[name=Datasource.extent_cache]': 'extentSelect',
    'click a[href=#extentCacheFlush]': 'extentCacheFlush',
    'change select[name=srs]': 'extentCacheFlush',
    'change select[name=srs-name]': 'nameToSrs',
    'keyup input[name=srs]': 'srsToName'
};

view.prototype.initialize = function(options) {
    if (!options.favorites) throw new Error('options.favorites required.');

    _(this).bindAll(
        'render',
        'save',
        'browse',
        'favoriteToggle',
        'favoriteUpdate',
        'placeholderUpdate',
        'cacheFlush',
        'extentSelect',
        'extentCacheFlush',
        'nameToSrs',
        'srsToName',
        'autoname'
    );
    this.favorites = options.favorites;
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Layer(this.model));

    // Quick easy way to check and set whether input
    // URI is favorited.
    this.$('input[name$=file], input[name=connection]').change();

    // Set active tab.
    var ds = this.model.get('Datasource')
    var type = ds && ds.type;
    this.$('a[href=#layer-' + (type||'file') + ']').click();

    if (!this.model.id) {
        // Autofocus first field for new layers.
        this.$('input[type=text]:first').focus();
    } else {
        // Check if we are using a custom sub layer of multiple for ogr datasources
        if (ds.layer) {
            var sublayer = this.$('.sublayer');
            sublayer.removeClass('hidden');
            sublayer.removeClass('display');
            var layer_select = sublayer.children('select[name=layer]');
            layer_select.append($('<option selected="selected"></option>').val(ds.layer).html(ds.layer));
            if (ds.all_layers && ds.layer != ds.all_layers) {
                if (ds.all_layers) {
                    _(ds.all_layers).each(function(element) {
                        layer_select.append($('<option></option>').val(element).html(element));
                    })
                }
            }
        }
    }
    return this;
};

view.prototype.extentSelect = function(ev) {
    var el = $(ev.currentTarget);
    var name = el.val();
    $('input[name="Datasource.extent"]').val('');
    if (name == 'auto') {
        $('a[href="#extentCacheFlush"]').css('display', 'inline-block');
        $('small[for=auto]').css('display', 'block');
    } else {
        $('a[href="#extentCacheFlush"]').css('display', 'none');
        $('small[for=auto]').css('display', 'none');
    }

    if (name == 'custom') {
        $('input[name="Datasource.extent"]').css('display', 'inline');
        $('small[for=custom]').css('display', 'block');
    } else {
        $('input[name="Datasource.extent"]').css('display', 'none');
        $('small[for=custom]').css('display', 'none');
    }

    if (name == 'dynamic') {
        $('small[for=dynamic]').css('display', 'block');
    } else {
        $('small[for=dynamic]').css('display', 'none');
    }
};

view.prototype.extentCacheFlush = function(ev) {
    $('input[name="Datasource.extent"]').val('');
    return false;
};

view.prototype.nameToSrs = function(ev) {
    var el = $(ev.currentTarget);
    var name = $(ev.currentTarget).val();
    if (this.model.SRS[name]) {
        el.siblings('input[name=srs]').val(this.model.SRS[name]);
    } else if (name === 'autodetect') {
        el.siblings('input[name=srs]').val('');
    }
};

view.prototype.srsToName = function(ev) {
    var el = $(ev.currentTarget);
    var srs = $(ev.currentTarget).val();
    el.siblings('select[name=srs-name]').val(this.model.srsName(srs));
};

view.prototype.favoriteToggle = function(ev) {
    var form = $(ev.currentTarget).parents('form');
    var uri = $('input[name$=file], input[name=connection]', form).val();
    // @TODO wait for 'success'? Throw errors?
    if (this.favorites.get(uri)) {
        var model = this.favorites.get(uri);
        this.favorites.remove(uri);
        model.destroy();
        $(ev.currentTarget).removeClass('active');
    } else if (uri) {
        var model = new models.Favorite({ id:uri, created:+new Date });
        this.favorites.add(model);
        model.save();
        $(ev.currentTarget).addClass('active');
    }
    return false;
};

view.prototype.favoriteUpdate = function(ev) {
    var target = $(ev.currentTarget);
    var favorite = target.siblings('a.favorite');
    var uri = target.val();
    var match;
    if (window.abilities.platform === 'win32') {
       match = uri.match(/^(\/|\\|[\w]:\\|http:\/\/|(.+\s)?dbname=[\w]+)/);
    } else {
       match = uri.match(/^(\/|http:\/\/|(.+\s)?dbname=[\w]+)/);
    }
    if (match) {
        favorite.removeClass('hidden');
        if (this.favorites.isFavorite(uri)) {
            favorite.addClass('active');
        } else {
            favorite.removeClass('active');
        }
    } else {
        favorite.addClass('hidden');
    }

    // Show cache clear link if datasource points to a URL and we're editing
    // an existing layer.
    var cache = target.siblings('.cache');
    if (this.model.id && uri.match(/^http:\/\/|^https:\/\//)) {
        cache.removeClass('hidden');
    } else {
        cache.addClass('hidden');
    }
    return false;
};

view.prototype.placeholderUpdate = function(ev) {
    var target = $(ev.currentTarget);
    var form = target.parents('form');
    $('input[name=id]',form).attr('placeholder', this.autoname(target.val()));
};

// Currently handles URLs and brute forces SQL queries into something usable.
// @TODO smarter handling for this or abandon the idea if it turns out to be
// untenable for queries.
view.prototype.autoname = function(source) {
    var sep = window.abilities.platform === 'win32' ? '\\' : '/';

    var cleanname = '';
    if (source) {
        cleanname = _(source.split(sep)).chain()
        .map(function(chunk) { return chunk.split('\\'); })
        .flatten()
        .last()
        .value()
        .split('.')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g,'')
        .replace('selectfrom','')
        .replace('select','')
        .substr(0,20);
    }

    if (!cleanname) {
        return "";
    }

    var attr = Bones.utils.form(this.model);

    attr.name =
    attr.id = cleanname;

    var count = 2;
    while (this.model.validate(attr)) {
        attr.name =
        attr.id = cleanname + count;
        count++;
    }

    return attr.id;
};

view.prototype.browse = function(ev) {
    var target = $(ev.currentTarget);
    var form = target.parents('form');
    var id = (function(form) {
        if (form.hasClass('layer-file')) return 'file';
        if (form.hasClass('layer-sqlite')) return 'sqlite';
        if (form.hasClass('layer-postgis')) return 'favoritesPostGIS';
    })(form);
    var location = $('input.browsable', form).val();
    if (location) {  // detect if the path is a file so we can browse its directory
        var sep = window.abilities.platform === 'win32' ? '\\' : '/';
        var components = location.split(sep);
        if (components && (components[components.length - 1][0] != '.') && location.match(/\.([0-9a-z]+)(?:[\?#]|$)/i)) {
            location = components.slice(0, components.length - 1).join(sep);
        }
    }

    target
        .toggleClass('active')
        .text(target.hasClass('active') ? 'Done' : 'Browse');
    $('ul.form', form).toggleClass('expand');

    if (target.is('.active')) (new models.Library({
        id:id,
        location:location,
        project: this.model.collection.parent.id
    })).fetch({
        success: _(function(model, resp) {
            new views.Library({
                model: model,
                favorites: this.favorites,
                change: function(uri) { $('input.browsable', form).val(uri).change(); },
                el: $('.browser', form)
            });
        }).bind(this),
        error: function(model, err) { new views.Modal(err) }
    });
    return false;
};

view.prototype.autostyle = function() {
    var root = this.model.collection.parent;
    var stylesheets = root.get('Stylesheet');
    if (stylesheets.length !== 0) {
        var cm = stylesheets.models[$('.tabs .tab.active').parent().index()].codemirror;
        if (cm) {
            // codemirror >= 2.2 uses posFromIndex
            var coord = cm.posFromIndex ? cm.posFromIndex(Infinity) : cm.coordsFromIndex(Infinity);
            cm.replaceRange(
                templates.Autostyle(this.model),
                coord,
                coord);
        }
        $('.actions a[href=#save]').click();
    }
};

view.prototype.save = function(e) {
    var form = $(e.target).parents('form');
    var autostyle = $(e.target).hasClass('with-style');
    var attr = Bones.utils.form(form, this.model);

    // Database datasources do not have the luxury of SRS autodetection.
    // Fallback to web mercator if unset.
    if (_(['sqlite', 'postgis']).include(attr.Datasource.type)) {
        attr.srs = attr.srs || this.model.SRS['900913'];
    } else {
        attr.srs = attr.srs || '';
    }
    // Advanced options.
    var regular = _(['type', 'file','table', 'host', 'port', 'user', 
        'password', 'dbname', 'extent', 'key_field', 'geometry_field',
        'type', 'attachdb', 'srs', 'id', 'project', 'extent_cache', 'layer', 'all_layers']);

    var result = {};
    _(attr.Datasource || {}).each(function(v, k) {
        if (regular.include(k)) result[k] = v;
    })
    attr.Datasource = _.extend(result, attr.advanced);
    var sublayer = this.$('.sublayer');
    if (sublayer) {
        var layer_select = sublayer.children('select[name=layer]');
        if (layer_select && layer_select.val()) {
            attr.Datasource.layer = layer_select.val();
        }
        attr.Datasource.all_layers = [];
        _(this.$('.sublayer option')).each(function(element) {
            if (!element.selected) {
                attr.Datasource.all_layers.push(element.value);
            }
        });
        if (attr.Datasource.all_layers.length > 0) {
            attr.Datasource.all_layers.sort();
        } else {
            delete attr.Datasource.all_layers;
        }
    } else {
        attr.Datasource.layer && delete attr.Datasource.layer
        attr.Datasource.all_layers && delete attr.Datasource.all_layers
    }

    // Parse PostGIS connection options.
    if (attr.connection) {
        var allowedArgs = ['user', 'password', 'dbname', 'port', 'host'];
        for (var key in attr.connection) if (!_(allowedArgs).include(key)) {
            new views.Modal(new Error('Invalid argument ' + key + ' in PostgreSQL connection string.'));
            return false;
        }
        if (!_(attr.connection).size()) {
            new views.Modal(new Error('Invalid PostgreSQL connection string.'));
            return false;
        }
        if (!attr.connection.dbname) {
            new views.Modal(new Error('dbname is required in PostgreSQL connection string.'));
            return false;
        }
        attr.Datasource = _(attr.Datasource||{}).defaults(attr.connection);
        delete attr.connection;
    }
    // Autoname this layer if id is blank.
    attr.name =
    attr.id = (attr.id || this.autoname(attr.Datasource.file||attr.Datasource.table)).replace('#','');
    attr['class'] = (attr['class'] || '').replace('.','');

    $(this.el).addClass('loading').addClass('restartable');
    var error = _(function(m, e) {
        if ($(this.el).hasClass('restarting')) return false;
        $(this.el).removeClass('loading').removeClass('restartable');
        if (e.responseText && e.responseText.indexOf('has multiple layers:') > -1) {
            var layers = e.responseText.split(':')[1].trim().split(',');
            var sublayer = this.$('.sublayer');
            sublayer.removeClass('hidden');
            sublayer.removeClass('display');
            var layer_select = sublayer.children('select[name=layer]');
            _(layers).each(function(element) {
                layer_select.append($('<option></option>').val(element).html(element));
            })
        } else {
            new views.Modal(e);
        }
    }).bind(this);
    this.model.validateAsync(attr, {
        success: _(function(model, resp) {
            $(this.el).removeClass('loading').removeClass('restartable');
            if (attr.Datasource && attr.Datasource.extent_cache === 'auto') {
                attr.Datasource.extent = resp.extent;
            }
            if (resp.sticky_options) {
                Object.keys(resp.sticky_options).forEach(function(opt) {
                    attr.Datasource[opt] = resp.sticky_options[opt];
                });
            }
            if (!this.model.set(attr, {error:error})) return;
            if (!this.model.collection.include(this.model)) {
                this.model.collection.add(this.model);
                if (autostyle) this.autostyle();
            }
            this.$('a[href="#close"]').click();
        }).bind(this),
        error: error
    });
    return false;
};

view.prototype.cacheFlush = function(ev) {
    $(this.el).addClass('loading');
    var target = $(ev.currentTarget);
    var form = target.parents('form');
    var url = form.hasClass('layer-sqlite') ? this.$('form.layer-sqlite input[name$=file]').val() : this.$('form.layer-file input[name$=file]').val();
    this.model.collection.parent.flush(this.model.id, url, {
        success: _(function(m, resp) {
            $(this.el).removeClass('loading');
        }).bind(this),
        error: _(function(m, err) {
            $(this.el).removeClass('loading');
            new views.Modal(err);
        }).bind(this)
    });
    return false;
};

