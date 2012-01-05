view = Backbone.View.extend();

view.prototype.events = {
    'click input[type=submit]': 'save',
    'click a[href=#open]': 'browse',
    'click a[href=#favorite]': 'favoriteToggle',
    'click a[href=#inspect]': 'inspect',
    'click a.remote-item': 'choose',
    'keyup input[name=file], input[name=connection]': 'favoriteUpdate',
    'change input[name=file], input[name=connection]': 'favoriteUpdate',
    'click a[href=#cacheFlush]': 'cacheFlush',
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
        'inspect',
        'favoriteUpdate',
        'cacheFlush',
        'nameToSrs',
        'srsToName'
    );
    this.favorites = options.favorites;
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Layer(this.model));

    // Quick easy way to check and set whether input
    // URI is favorited.
    this.$('input[name=file], input[name=connection]').change();

    // Set active tab.
    var type = this.model.get('Datasource') && this.model.get('Datasource').type;
    this.$('a[href=#layer-' + (type||'file') + ']').click();

    // Autofocus first field for new layers.
    if (!this.model.id) this.$('input[type=text]:first').focus();
    return this;
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
    var uri = $('input[name=file], input[name=connection]', form).val();
    // @TODO wait for 'success'? Throw errors?
    if (this.favorites.get(uri)) {
        var model = this.favorites.get(uri);
        this.favorites.remove(uri);
        model.destroy();
        $(ev.currentTarget).removeClass('active');
    } else if (uri) {
        var model = new models.Favorite({id:uri});
        this.favorites.add(model);
        model.save();
        $(ev.currentTarget).addClass('active');
    }
    return false;
};

view.prototype.choose = function(ev) {
    var form = $(ev.currentTarget).parents('form');
    var uri = $('input#url', form).val($(ev.currentTarget).attr('href'));
    ev.stopPropagation();
    ev.preventDefault();
};

view.prototype.inspect = function(ev) {
    var form = $(ev.currentTarget).parents('form');
    var uri = $('input#url', form).val();
    // @TODO wait for 'success'? Throw errors?

    $.ajax({
        url: uri,
        contentType: 'application/json',
        dataType: 'jsonp',
        success: function(resp) {
            $('.inspector', form).html(templates.RemoteDatasource(resp));
        },
        error: function() {
        }
    });
    return false;
};

view.prototype.favoriteUpdate = function(ev) {
    var target = $(ev.currentTarget);
    var favorite = target.siblings('a.favorite');
    var uri = target.val();
    if (uri.match(/^(\/|http:\/\/|(.+\s)?dbname=[\w]+)/)) {
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

view.prototype.browse = function(ev) {
    var target = $(ev.currentTarget);
    var form = target.parents('form');
    var id = (function(form) {
        if (form.hasClass('layer-file')) return 'file';
        if (form.hasClass('layer-sqlite')) return 'sqlite';
        if (form.hasClass('layer-postgis')) return 'favoritesPostGIS';
    })(form);
    var components = $('input.browsable', form).val().split('/');
    var location = components.slice(0, components.length - 1).join('/');

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
                change: function(uri) {
                    $('input.browsable', form).val(uri);
                    if ($('input[name=id]', form).val() == '') {
                        // Get the 'basename' of the file, minus anything
                        // after the first dot, in alphanumeric
                        // and lowercase.
                        $('input[name=id]', form).val(
                            _(uri.split('/')).last().split('.')[0]
                                .replace(/[^a-z0-9]/gi,'').toLowerCase());
                    }
                },
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
        var cm = stylesheets.models[0].codemirror;
        var coord = cm.coordsFromIndex(Infinity);
        cm.replaceRange(
            templates.Autostyle(this.model),
            coord,
            coord);
        $('.actions a[href=#save]').click();
    }
};

view.prototype.save = function(e) {
    var form = $(e.target).parents('form');
    var autostyle = $(e.target).hasClass('with-style');
    var parseOptions = function (o) {
        return _(o.match(/([\d\w]*)\=(\"[^\"]*\"|[^\s]*)/g)).reduce(function(memo,pair) {
            pair = pair.replace(/"|'/g, '').split('=');
            memo[pair[0]] = pair[1];
            return memo;
        }, {});
    };
    var deepSet = function(attr, keys, val) {
        if (!keys.length) return val;
        var key = keys.shift();
        attr[key] = deepSet(attr[key]||{}, keys, val);
        return attr;
    };
    var attr = _($('input[name]:not(.parsable),textarea',form)).reduce(function(memo, el) {
        return deepSet(memo, $(el).attr('name').split('.'), $(el).val());
    }, {});

    attr['name'] = (attr['id']||'').replace('#','');
    attr['id'] = (attr['id']||'').replace('#','');
    attr['class'] = (attr['class']||'').replace('.','');
    attr['srs'] = attr['srs'] || this.model.SRS['900913'];
    attr['Datasource'] = _(attr['Datasource']||{})
        .defaults(parseOptions($('input[name=advanced]', form).val()));

    // Parse PostGIS connection options.
    if ($('input[name=connection]', form).size()) {
        var allowedArgs = ['user', 'password', 'dbname', 'port', 'host'];
        var connection = parseOptions($('input[name=connection]', form).val());
        for (var key in connection) if (!_(allowedArgs).include(key)) {
            new views.Modal(new Error('Invalid argument ' + key + ' in PostgreSQL connection string.'));
            return false;
        }
        if (!_(connection).size()) {
            new views.Modal(new Error('Invalid PostgreSQL connection string.'));
            return false;
        }
        if (!connection.dbname) {
            new views.Modal(new Error('dbname is required in PostgreSQL connection string.'));
            return false;
        }
        attr.Datasource = _(attr.Datasource).defaults(connection);
    }

    $(this.el).addClass('loading').addClass('restartable');
    var error = _(function(m, e) {
        if ($(this.el).hasClass('restarting')) return false;
        $(this.el).removeClass('loading').removeClass('restartable');
        new views.Modal(e);
    }).bind(this);
    this.model.validateAsync(attr, {
        success: _(function() {
            $(this.el).removeClass('loading').removeClass('restartable');
            if (!this.model.set(attr, {error:error})) return;
            if (!this.model.collection.include(this.model)) {
                this.model.collection.add(this.model);
                if (autostyle) this.autostyle();
            }
            this.$('.close').click();
        }).bind(this),
        error: error
    });
    return false;
};

view.prototype.cacheFlush = function(ev) {
    $(this.el).addClass('loading');
    var url = this.$('form.layer-file input[name=file]').val();
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

