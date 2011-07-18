view = Backbone.View.extend();

view.prototype.events = {
    'click .layerFile input[type=submit]': 'saveFile',
    'click .layerPostGIS input[type=submit]': 'savePostGIS'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'saveFile', 'savePostGIS');
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Layer(this.model));
    return this;
};

view.prototype.saveFile = function() {
    var datasource = new models.Datasource();
    var attr = {
            id: this.$('form.layerFile input[name=id]').val(),
            project: this.model.collection.parent.get('id'),
            file: this.$('form.layerFile input[name=file]').val()
    }
    var options = { error: function(m, e) { new views.Modal(e); } };
    if (datasource.set(attr, options)) {
        $(this.el).addClass('loading');
        datasource.fetch({
            success: _(function() {
                var attr = {
                    'id':    this.$('form.layerFile input[name=id]').val(),
                    'name':  this.$('form.layerFile input[name=id]').val(),
                    'srs':   this.$('form.layerFile input[name=srs]').val(),
                    'class': this.$('form.layerFile input[name=class]').val(),
                    'geometry': datasource.get('geometry_type'),
                    'Datasource': {
                        'file': datasource.get('file')
                    }
                };
                var options = { error: function(m, e) { new views.Modal(e); } };
                if (this.model.set(attr, options)) {
                    if (!this.model.collection.include(this.model))
                        this.model.collection.add(this.model);
                    this.$('.close').click();
                }
                $(this.el).removeClass('loading');
            }).bind(this),
            error: _(function(m, e) {
                new views.Modal(e);
                $(this.el).removeClass('loading');
            }).bind(this)
        });
    }
    return false;
};

view.prototype.savePostGIS = function() {
    var connection = /pgsql:\/\/([^:@\/]*):?([^@\/]*)@?([^\/:]*):?(\d*)\/?([^\/]*)/
        .exec(this.$('form.layerPostGIS input[name=connection]').val());
    if (!connection) {
        new views.Modal(new Error('Invalid PostgreSQL connection string.'));
        return false;
    }
    var attr = {
        'id':    this.$('form.layerPostGIS input[name=id]').val(),
        'name':  this.$('form.layerPostGIS input[name=id]').val(),
        'srs':   this.$('form.layerPostGIS input[name=srs]').val(),
        'class': this.$('form.layerPostGIS input[name=class]').val(),
        'Datasource': {
            'username': connection[1],
            'password': connection[2],
            'host':     connection[3],
            'port':     connection[4],
            'dbname':   connection[5],
            'table':    this.$('textarea[name=table]', this.el).val(),
            'geometry_field': this.$('input[name=geometry_field]', this.el).val(),
            'extent':   this.$('input[name=extent]', this.el).val(),
            'type': 'postgis'
        }
    };
    var options = { error: function(m, e) { new views.Modal(e); } };
    if (this.model.set(attr, options)) {
        if (!this.model.collection.include(this.model))
            this.model.collection.add(this.model);
        this.$('.close').click();
    }
    return false;
};
