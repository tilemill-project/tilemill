view = Backbone.View.extend();

view.prototype.events = {
    'click .layerFile input[type=submit]': 'saveFile',
    'click .layerPostGIS input[type=submit]': 'savePostGIS',
    'click .layerSqlite input[type=submit]': 'saveSqlite',
    'click a[href=#open]': 'browse',
    'click a[href=#favorite]': 'favoriteToggle',
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
        'saveFile',
        'savePostGIS',
        'browse',
        'favoriteToggle',
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

    if (this.model.get('Datasource')) {
        if (this.model.get('Datasource').type == 'sqlite') {
            this.$('a[href=#layerSqlite]').click();
        } else if (this.model.get('Datasource').file) {
            this.$('a[href=#layerFile]').click();
        } else if (this.model.get('Datasource').type == 'postgis') {
            this.$('a[href=#layerPostGIS]').click();
        }
    }

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
    target
        .toggleClass('active')
        .text(target.hasClass('active') ? 'Done' : 'Browse');

    var id;
    var form = target.parents('form');
    if (form.is('.layerFile')) {
        id = 'file';
    } else if (form.is('.layerSqlite')) {
        id = 'sqlite';
    } else if (form.is('.layerPostGIS')) {
        id = 'favoritesPostGIS';
    }
    $('ul.form', form).toggleClass('expand');

    var components = $('input[name=file], input[name=connection]', form)
        .val()
        .split('/');
    var location = components.slice(0, components.length - 1).join('/');

    if (target.is('.active')) (new models.Library({
        id:id,
        location:location,
        project: this.model.collection.parent.id
    })).fetch({
        success: _(function(model, resp) {
            new views.Library({
                model: model,
                favorites: this.favorites,
                input: $('input[name=file], input[name=connection]', form),
                el: $('.browser', form)
            });
        }).bind(this),
        error: function(model, err) { new views.Modal(err) }
    });
    return false;
};

view.prototype.saveFile = function() {
    $(this.el).addClass('loading');
    var attr = {
        'name':  this.$('input[name=id]').val().replace('#', ''),
        'id':    this.$('input[name=id]').val().replace('#', ''),
        'srs':   this.$('input[name=srs]').val(),
        'class': this.$('input[name=class]').val().replace('.', ''),
        'Datasource': {
            'file': this.$('input[name=file]').val()
        }
    };
    _(attr['Datasource']).defaults(this.parseOptions(this.$('input[name=advanced]').val()));
    var error = _(function(m, e) {
        $(this.el).removeClass('loading');
        new views.Modal(e);
    }).bind(this);
    this.model.validateAsync(attr, { success:_(function() {
        $(this.el).removeClass('loading');
        if (!this.model.set(attr, {error:error})) return;
        if (!this.model.collection.include(this.model))
            this.model.collection.add(this.model);
        this.$('.close').click();
    }).bind(this), error:error });
    return false;
};

view.prototype.savePostGIS = function() {
    $(this.el).addClass('loading');
    var attr = {
        'name':  this.$('form.layerPostGIS input[name=id]').val().replace('#', ''),
        'id':    this.$('form.layerPostGIS input[name=id]').val().replace('#', ''),
        'srs':   this.$('form.layerPostGIS input[name=srs]').val()
            || this.model.SRS['900913'],
        'class': this.$('form.layerPostGIS input[name=class]').val().replace('.', ''),
        'Datasource': {
            'table':    this.$('textarea[name=table]', this.el).val(),
            'key_field': this.$('input[name=key_field]', this.el).val(),
            'geometry_field': this.$('input[name=geometry_field]', this.el).val(),
            'extent':   this.$('input[name=extent]', this.el).val(),
            'type': 'postgis'
        }
    };
    _(attr['Datasource']).defaults(this.parseOptions(this.$('form.layerPostGIS input[name=advanced]').val()));

    // Special parseing around PostGIS connection.
    var error;
    var allowedArgs = ['user', 'password', 'dbname', 'port', 'host'];
    var connection = this.parseOptions(this.$('form.layerPostGIS input[name=connection]').val());
    _(connection).each(function(val, key) {
        if (allowedArgs.indexOf(key) === -1) {
            error = new Error('Invalid argument ' + key + ' in PostgreSQL connection string.');
        }
    });
    if (!error && !_(connection).size()) {
        error = new Error('Invalid PostgreSQL connection string.');
    } else if (!error && !connection.dbname) {
        error = new Error('dbname is required in PostgreSQL connection string.');
    }
    if (error) {
        $(this.el).removeClass('loading');
        new views.Modal(error);
        return false;
    }
    var error = _(function(m, e) {
        $(this.el).removeClass('loading');
        new views.Modal(e);
    }).bind(this);
    _(attr['Datasource']).defaults(connection);

    this.model.validateAsync(attr, { success:_(function() {
        $(this.el).removeClass('loading');
        if (!this.model.set(attr, {error:error})) return;
        if (!this.model.collection.include(this.model))
            this.model.collection.add(this.model);
        this.$('.close').click();
    }).bind(this), error:error });
    return false;
};

view.prototype.saveSqlite = function() {
    $(this.el).addClass('loading');
    var attr = {
        'name':  this.$('form.layerSqlite input[name=id]').val().replace('#', ''),
        'id':    this.$('form.layerSqlite input[name=id]').val().replace('#', ''),
        'srs':   this.$('form.layerSqlite input[name=srs]').val()
            || this.model.SRS['900913'],
        'class': this.$('form.layerSqlite input[name=class]').val().replace('.', ''),
        'Datasource': {
            'file': this.$('form.layerSqlite input[name=file]').val(),
            'table':     this.$('form.layerSqlite textarea[name=table]', this.el).val(),
            'attachdb':  this.$('input[name=attachdb]', this.el).val(),
            'extent':    this.$('form.layerSqlite input[name=extent]', this.el).val(),
            'type': 'sqlite'
        }
    };
    _(attr['Datasource']).defaults(this.parseOptions(this.$('form.layerSqlite input[name=advanced]').val()));
    var error = _(function(m, e) {
        $(this.el).removeClass('loading');
        new views.Modal(e);
    }).bind(this);
    this.model.validateAsync(attr, { success:_(function() {
        $(this.el).removeClass('loading');
        if (!this.model.set(attr, {error:error})) return;
        if (!this.model.collection.include(this.model))
            this.model.collection.add(this.model);
        this.$('.close').click();
    }).bind(this), error:error });
    return false;
};

view.prototype.parseOptions = function (o) {
    var options = {};
    _(o.match(/([\d\w]*)\=(\"[^\"]*\"|[^\s]*)/g)).each(function(pair) {
        pair = pair.replace(/"|'/g, '').split('=');
        options[pair[0]] = pair[1];
    });
    return options;
}

view.prototype.cacheFlush = function(ev) {
    $(this.el).addClass('loading');
    var url = this.$('form.layerFile input[name=file]').val();
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

