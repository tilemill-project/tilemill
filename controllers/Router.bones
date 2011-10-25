controller = Backbone.Controller.extend();

controller.prototype.initialize = function() {
    if (Bones.server) return;
    new views.App({ el: $('body') });

    // Add catchall route to show error page.
    this.route(/^(.*?)/, 'error', this.error);
};

controller.prototype.routes = {
    '': 'projects',
    '/': 'projects',
    '/project/:id': 'project',
    '/project/:id/export': 'projectExport',
    '/project/:id/export/:format': 'projectExport',
    '/manual': 'manual',
    '/manual/:page?': 'manual'
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
}
