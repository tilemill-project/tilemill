controller = Backbone.Controller.extend();

controller.prototype.initialize = function() {
    if (!Bones.server) new views.App({ el: $('body') });
};

controller.prototype.routes = {
    '': 'projects',
    '/': 'projects',
    '/project/:id': 'project',
    '/project/:id/export': 'projectExport',
    '/project/:id/export/:format': 'projectExport',
    '/manual': 'manual'
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

controller.prototype.manual = function() {
    new views.Manual({
        el: $('#page')
    });
}
