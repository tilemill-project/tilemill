view = Backbone.View.extend();

view.prototype.events = {
    'click .layerFile input[type=submit]': 'saveFile',
    'click .layerPostGIS input[type=submit]': 'savePostGIS',
    'change select[name=srs-name]': 'nameToSrs',
    'keyup input[name=srs]': 'srsToName'
};

view.prototype.initialize = function(options) {
    _(this).bindAll(
        'render',
        'saveFile',
        'savePostGIS',
        'nameToSrs',
        'srsToName'
    );
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Layer(this.model));
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
            || this.$('form.layerPostGIS input[name=srs]').attr('placeholder'),
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
