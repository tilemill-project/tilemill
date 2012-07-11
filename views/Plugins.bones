view = Backbone.View.extend();

view.prototype.events = {
    'click a.install': 'npm',
    'click a.uninstall': 'npm',
    'click a.upgrade': 'npm'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'npm', 'plugins');
    this.restarting = false;
    this.available = new models.Plugins;
    this.render();
    this.plugins();
};

// Load plugins collection and render them.
view.prototype.plugins = function() {
    this.$('.available').addClass('loading');
    this.available.fetch({
        success: _(function(m) {
            this.$('.available').removeClass('loading');
            // Add latest version info the install plugins
            this.collection.map(function(i) {
                var avail = m.get(i.id);
                if (avail) i.set({ latest: avail.get('dist-tags').latest});
                return m;
            });
            // Re-render entire pane to add upgrade buttons
            this.el.html(templates.Plugins(this));
        }).bind(this),
        error: _(function(m, err) {
            // If server is restarting, just stop. The page
            // will refresh anyhow when the server starts back up.
            if (this.restarting) return;

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

view.prototype.npm = function(ev) {
    this.restarting = true;

    var id = $(ev.currentTarget).attr('href').split('#').pop();
    var options = {
        success: function(m) {
            $.ajax({
                url: '/restart',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({'bones.token':Backbone.csrf('/restart')}),
                dataType: 'json',
                processData: false,
                success: function() {
                    Bones.utils.until('/status', function() {
                        window.location.reload();
                    });
                },
                error: function(err) {
                    $('body').removeClass('loading');
                    new views.Modal(err);
                }
            });
        },
        error: _(function(m, err) {
            $('body').removeClass('loading');
            new views.Modal(err);
        }).bind(this)
    };

    // Clear intervals. We know the server is about to die
    // so we don't need to display errors about it.
    _(Bones.intervals||[]).each(clearInterval);

    $('body').addClass('loading');
    if ($(ev.currentTarget).hasClass('install') || $(ev.currentTarget).hasClass('upgrade')) {
        new models.Plugin({id:id}).save({}, options);
    } else {
        new models.Plugin({id:id}).destroy(options);
    }
    return false;
};

