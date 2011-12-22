view = Backbone.View.extend();

view.prototype.events = {
    'click a.install': 'install',
    'click a.uninstall': 'uninstall'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'install', 'uninstall');
    this.collection.bind('add', this.render);
    this.collection.bind('remove', this.render);
    this.available = new models.Plugins;
    this.render();

    // Load plugins collection and render them.
    this.$('.available').addClass('loading');
    this.available.fetch({
        success: _(function(m) {
            this.$('.available').removeClass('loading');
            m.each(_(function(plugin) {
                if (this.collection.get(plugin.id)) {
                    plugin.set({installed:true});
                    return;
                }
                this.$('.available ul.grid').append(templates.Plugin(plugin));
            }).bind(this));
        }).bind(this),
        error: _(function(m, err) {
            this.$('.available').removeClass('loading');
            new views.Modal(err);
        }).bind(this)
    });
};

view.prototype.render = function() {
    $('.bleed .active').removeClass('active');
    $('.bleed .plugins').addClass('active');
    this.el.html(templates.Plugins(this));
    return this;
};

view.prototype.install = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    $('body').addClass('loading');
    new models.Plugin({id:id}).save({}, {
        success: _(function(m) {
            $('body').removeClass('loading');
            window.abilities.plugins[m.id] = m.toJSON();
            var available = this.available.get(m.id);
            if (available) available.set({installed:true});
            this.collection.add(m);
        }).bind(this),
        error: _(function(m, err) {
            $('body').removeClass('loading');
            new views.Modal(err);
        }).bind(this)
    });
    return false;
};

view.prototype.uninstall = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    $('body').addClass('loading');
    new models.Plugin({id:id}).destroy({
        success: _(function(m) {
            $('body').removeClass('loading');
            delete window.abilities.plugins[m.id];
            var available = this.available.get(m.id);
            if (available) available.set({installed:false});
            this.collection.remove(this.collection.get(m.id));
        }).bind(this),
        error: _(function(m, err) {
            $('body').removeClass('loading');
            new views.Modal(err);
        }).bind(this)
    });
    return false;
};

