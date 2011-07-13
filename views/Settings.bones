view = Backbone.View.extend();

view.prototype.events = {
    'click input[type=submit]': 'saveSettings',
    'change select#interactivity-layer': 'dependentTooltipFields'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'saveSettings', 'dependentTooltipFields');
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Settings({project: this.model}));
    return this;
};

view.prototype.saveSettings = function() {
    var interactivity = this.$('select#interactivity-layer').val() ? {
        'layer': this.$('select#interactivity-layer').val(),
        'key_name': this.$('select#interactivity-key-name').val(),
        'template_teaser': this.$('select#interactivity-template-teaser').val(),
        'template_full': this.$('select#interactivity-template-full').val(),
        'template_location': this.$('select#interactivity-template-location').val(),
    } : false;
    var attr = {
        '_name':          this.$('input[name=name]').val(),
        '_description':   this.$('input[name=description]').val(),
        '_attribution':   this.$('input[name=attribution]').val(),
        '_version':       this.$('input[name=version]').val(),
        '_format':        this.$('select[name=format]').val(),
        '_interactivity': interactivity,
        '_legend':        this.$('textarea[name=legend]').val()
    }
    var options = { error: function(m, e) { new views.Modal(e); } };
    if (this.model.set(attr, options)) {
        this.model.save();
        this.$('.close').click();
    }
    return false;
}

view.prototype.dependentTooltipFields = function() {}

