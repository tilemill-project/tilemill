controller = Backbone.Controller.extend();

controller.prototype.initialize = function() {
    if (Bones.server) return;
    new views.App({ el: $('body') });

    // Check whether there is a new version of TileMill or not.
    $.ajax({
        url: '/api/updatesVersion',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            if (!data || !data.updates) return;
            if (!semver.gt(data.updatesVersion,
                    window.abilities.tilemill.version)) return;
            new views.Modal({
                content:_('\
                            A new version of TileMill is available.<br />\
                            Update to TileMill <%=version%> today.<br/>\
                            <small>You can disable update notifications in the <strong>Settings</strong> panel.</small>\
                            ').template({ version:data.updatesVersion }),
                affirmative: 'Update',
                negative: 'Later',
                callback: function() {
                    if (typeof process === 'undefined' || typeof process.versions['atom-shell'] === undefined) {
                        window.open('http://tilemill.com');
                    }
                    shell.openExternal('https://www.mapbox.com/tilemill/');
                }
            });
        }
    });

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
    '/oauth/success': 'oauthSuccess',
    '/oauth/error': 'oauthError',
    '/manual': 'manual',
    '/manual/:page?': 'manual',
    '/settings': 'config',
    '/plugins': 'plugins',
};

controller.prototype.goto = function(path) {
    var go = !window.onbeforeunload || window.onbeforeunload() !== false;
    if (go !== false) window.location.hash = path;
};

controller.prototype.error = function() {
    new views.Error(new Error('Page not found.'));
};

controller.prototype.projects = function(next) {
    (new models.Projects()).fetch({
        success: function(collection) {
            new views.Projects({
                el: $('#page'),
                collection: collection
            });
            if (next) next();
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

controller.prototype.oauthSuccess = function() {
    this.projects(function() {
        new views.Modal({
            content: 'Your MapBox account was authorized successfully.',
            negative: '',
            callback: function() {}
        });
    });
};

controller.prototype.oauthError = function() {
    this.projects(function() {
        new views.Modal({
            content: 'An error occurred while authorizing your MapBox account.',
            negative: '',
            callback: function() {}
        });
    });
};

