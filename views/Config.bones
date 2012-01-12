view = Backbone.View.extend();

view.prototype.events = {
    'change input[name=updates]': 'updates',
    'keyup input[name=files]': 'files',
    'change input[name=files]': 'files',
    'click input[type=submit]': 'save',
    'click a[href=#disable]': 'disable'
};

view.prototype.initialize = function(options) {
    this._restart = false;
    _(this).bindAll(
        'render',
        'changed',
        'files',
        'updates',
        'disable',
        'save',
        'restart'
    );
    this.model.bind('change', this.changed);
    this.model.bind('change:files', this.restart);
    this.render();
};

view.prototype.render = function() {
    $('.bleed .active').removeClass('active');
    $('.bleed .settings').addClass('active');
    this.el.html(templates.Config(this.model));
    Bones.utils.sliders(this.$('.slider'), this.model);
    return this;
};

view.prototype.changed = function() {
    this.$('input[type=submit]').removeClass('disabled').val('Save');
};

view.prototype.saved = function() {
    this.$('input[type=submit]').addClass('disabled').val('Saved');
};

view.prototype.files = function(ev) {
    this.model.set({files: $(ev.currentTarget).val()});
    return false;
};

view.prototype.updates = function(ev) {
    this.model.set({updates: $(ev.currentTarget).is(':checked')});
};

view.prototype.disable = function(ev) {
    this.model.set({
        'syncAccount': '',
        'syncAccessToken': ''
    });
    this.$('.syncOn').addClass('dependent');
    this.$('.syncOff').removeClass('dependent');
    return false;
};

view.prototype.save = function() {
    if (this.$('input[type=submit]').hasClass('disabled')) return false;

    this.model.save({}, {
        success: _(function() {
            if (this._restart) new views.Modal({
                content: 'These changes require you to restart TileMill manually.',
                affirmative: 'Ok',
                negative: '',
                callback: function() {}
            });
            this._restart = false;
            this.saved();
        }).bind(this),
        error: function(m, err) { new views.Modal(err); }
    });
    return false;
};

view.prototype.restart = function() {
    this._restart = true;
};


