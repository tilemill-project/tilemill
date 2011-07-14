view = Backbone.View.extend();

view.prototype.events = {
    'click input[type=submit]': 'save',
    'change select[name=layer]': 'attach'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'save', 'attach');
    this.render().attach();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Settings(this.model));
    return this;
};

view.prototype.save = function() {
    var interactivity = this.$('select[name=layer]').val() ? {
        'layer': this.$('select[name=layer]').val(),
        'key_name': this.$('select[name=key_name]').val(),
        'template_teaser': this.$('textarea[name=template_teaser]').val(),
        'template_full': this.$('textarea[name=template_full]').val(),
        'template_location': this.$('input[name=template_location]').val(),
    } : false;
    var attr = {
        'name':          this.$('input[name=name]').val(),
        'description':   this.$('input[name=description]').val(),
        'attribution':   this.$('input[name=attribution]').val(),
        'version':       this.$('input[name=version]').val(),
        'format':        this.$('select[name=format]').val(),
        'interactivity': interactivity,
        'legend':        this.$('textarea[name=legend]').val()
    };
    var options = { error: function(m, e) { new views.Modal(e); } };
    if (this.model.set(attr, options)) {
        this.model.save();
        this.model.trigger('save');
        this.$('.close').click();
    }
    return false;
};

view.prototype.attach = function() {
    var id = this.$('select[name=layer]').val();
    var layer = this.model.get('Layer').get(id);

    // If no layer is selected hide dependents and back out.
    if (!layer) {
        this.$('.dependent').hide();
        return;
    }

    $('#popup').addClass('loading');
    var model = new models.Datasource(_(layer.get('Datasource')).extend({
        id: layer.get('id'),
        project: this.model.get('id')
    }));
    model.fetchFeatures({
        success: _(function(model) {
            var fields = _(model.get('fields')).keys();

            this.$('select[name=key_name]').html(_(fields).map(function(f) {
                return _("<option value='<%=f%>'><%=f%></option>").template({f:f});
            }).join(' '));
            this.$('select[name=key_name]').val((this.model.get('interactivity') || {}).key_name);

            this.$('.tokens').html(_(fields).map(function(f) {
                return _('<code>[<%=f%>]</code>').template({f:f});
            }).join(' '));

            this.$('.dependent').show();
            $('#popup').removeClass('loading');
        }).bind(this),
        error: function(model, err) { new views.Modal(err); }
    });

    if (!layer) return;
};


