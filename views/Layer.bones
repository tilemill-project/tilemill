view = Backbone.View.extend();

view.prototype.events = {
    'click .layerFile input[type=submit]': 'saveFile',
    'click .layerPostGIS input[type=submit]': 'savePostGIS',
    'click .layerFile a[href=#open]': 'browseFile',
    'click .layerPostGIS a[href=#open]': 'browsePostGIS',
    'click a[href=#favorite]': 'favoriteToggle',
    'keyup input[name=file], input[name=connection]': 'favoriteUpdate',
    'change input[name=file], input[name=connection]': 'favoriteUpdate',
    'change select[name=srs-name]': 'nameToSrs',
    'keyup input[name=srs]': 'srsToName'
};

view.prototype.initialize = function(options) {
    if (!options.favorites) throw new Error('options.favorites required.');

    _(this).bindAll(
        'render',
        'saveFile',
        'savePostGIS',
        'browseFile',
        'browsePostGIS',
        'favoriteToggle',
        'favoriteUpdate',
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
        if (this.model.get('Datasource').file) {
            this.$('a[href=#layerFile]').click();
        } else if (this.model.get('Datasource').type == 'postgis') {
            this.$('a[href=#layerPostGIS]').click();
        }
    }
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
    var uri = $(ev.currentTarget).val();
    if (this.favorites.get(uri)) {
        $(ev.currentTarget).siblings('a.favorite').addClass('active');
    } else {
        $(ev.currentTarget).siblings('a.favorite').removeClass('active');
    }
    return false;
};

view.prototype.browseFile = function(ev) {
    var id = 'file';
    var target = $(ev.currentTarget);
    target.toggleClass('active');
    this.$('.layerFile ul.form').toggleClass('expand');

    if (target.is('.active')) (new models.Library({id:id})).fetch({
        success: _(function(model, resp) {
            new views.Library({
                model: model,
                input: this.$('.layerFile input[name=file]'),
                el: this.$('.layerFile .browser')
            });
        }).bind(this),
        error: function(model, err) { new views.Modal(err) }
    });
    return false;
};

view.prototype.browsePostGIS = function(ev) {
    var id = 'favoritesPostGIS';
    var target = $(ev.currentTarget);
    target.toggleClass('active');
    this.$('.layerPostGIS ul.form').toggleClass('expand');

    if (target.is('.active')) (new models.Library({id:id})).fetch({
        success: _(function(model, resp) {
            new views.Library({
                model: model,
                input: this.$('.layerPostGIS input[name=connection]'),
                el: this.$('.layerPostGIS .browser')
            });
        }).bind(this),
        error: function(model, err) { new views.Modal(err) }
    });
    return false;
};

view.prototype.saveFile = function() {
    $(this.el).addClass('loading');
    var attr = {
        'id':    this.$('input[name=id]').val(),
        'name':  this.$('input[name=id]').val(),
        'srs':   this.$('input[name=srs]').val(),
        'class': this.$('input[name=class]').val(),
        'Datasource': {
            'file': this.$('input[name=file]').val()
        }
    };
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
    var connection = /pgsql:\/\/(([^:@\/]+):?([^@\/]*)@)?([^\/:]*):?(\d*)\/?([^\/]*)/
        .exec(this.$('form.layerPostGIS input[name=connection]').val());
    if (!connection) {
        $(this.el).removeClass('loading');
        new views.Modal(new Error('Invalid PostgreSQL connection string.'));
        return false;
    }
    var attr = {
        'id':    this.$('form.layerPostGIS input[name=id]').val(),
        'name':  this.$('form.layerPostGIS input[name=id]').val(),
        'srs':   this.$('form.layerPostGIS input[name=srs]').val()
            || this.model.SRS['900913'],
        'class': this.$('form.layerPostGIS input[name=class]').val(),
        'Datasource': {
            'username': connection[2],
            'password': connection[3],
            'host':     connection[4],
            'port':     connection[5],
            'dbname':   connection[6],
            'table':    this.$('textarea[name=table]', this.el).val(),
            'geometry_field': this.$('input[name=geometry_field]', this.el).val(),
            'extent':   this.$('input[name=extent]', this.el).val(),
            'type': 'postgis'
        }
    };
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

