controller = Backbone.Controller.extend();

controller.prototype.initialize = function() {
    if (Bones.server) return;
    new views.App({ el: $('body') });

    // Check whether there is a new version of TileMill or not.
    (new models.Config).fetch({success: function(m) {
        if (window.abilities.platform === 'darwin') return;
        if (!m.get('updates')) return;
        if (!semver.gt(m.get('updatesVersion'),
            window.abilities.tilemill.version)) return;
        new views.Modal({
            content:_('\
                A new version of TileMill is available.<br />\
                Update to TileMill <%=version%> today.<br/>\
                <small>You can disable update notifications in the <strong>Settings</strong> panel.</small>\
            ').template({ version:m.get('updatesVersion') }),
            affirmative: 'Update',
            negative: 'Later',
            callback: function() { window.open('http://tilemill.com') }
        });
    }});

    // Add catchall routes for error page.
    this.route(/^(.*?)/, 'error', this.error);
};

controller.prototype.routes = {
    '.*\?goto=*path': 'goto',
    '': 'projects',
    '/': 'projects',
    '/project/:id': 'project',
    '/project/:id/export': 'projectExport',
    '/project/:id/export/:format': 'projectExport',
    '/project/:id/settings': 'projectSettings',
    '/manual': 'manual',
    '/manual/:page?': 'manual',
    '/settings': 'config',
    '/plugins': 'plugins'
};

controller.prototype.goto = function(path) {
    var go = !window.onbeforeunload || window.onbeforeunload() !== false;
    if (go !== false) window.location.hash = path;
};

controller.prototype.error = function() {
    new views.Error(new Error('Page not found.'));
};

controller.prototype.projects = function() {
    (new models.Projects()).fetch({
        success: function(collection) {
            new views.Projects({
                el: $('#page'),
                collection: collection
            });
        },
        error: function(m, e) { new views.Modal(e); }
    });
};

controller.prototype.project = function(id, next) {
    (new models.Project({ id: id })).fetch({
        success: function(model) {
            new views.Project({
                el: $('#page'),
                model: model
            });
            if (next) next();
        },
        error: function(m, e) { new views.Modal(e); }
    });
};

controller.prototype.projectExport = function(id, format) {
    this.project(id, _(function() {
        if (format) {
            $('.actions a[href=#export-'+format+']').click();
        } else {
            $('.actions a[href=#exports]').click();
        }
    }).bind(this));
};

controller.prototype.projectSettings = function(id, format) {
    this.project(id, _(function() {
        $('.actions a[href=#settings]').click();
    }).bind(this));
};

controller.prototype.manual = function(page) {
    Bones.utils.fetch({
        page: new models.Page({ id: page }),
        pages: new models.Pages()
    }, function(err, data) {
        if (err) return new views.Modal(err);
        new views.Manual({
            el: $('#page'),
            model: data.page,
            collection: data.pages,
            page: page
        });
    });
};

controller.prototype.config = function() {
    (new models.Config).fetch({
        success: function(model, resp) {
            new views.Config({
                el: $('#page'),
                model: model
            });
        },
        error: function(model, err) {
            new views.Modal(err);
        }
    });
};

controller.prototype.plugins = function() {
    new views.Plugins({
        el: $('#page'),
        collection: new models.Plugins(_(window.abilities.plugins).toArray())
    });
};

