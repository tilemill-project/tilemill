controller = Backbone.Controller.extend();

controller.prototype.initialize = function() {
    if (!Bones.server) new views.App({ el: $('body') });
};

controller.prototype.routes = {
    '': 'projects',
    '/': 'projects',
    '/project/:id': 'project'
};

controller.prototype.projects = function() {
    (new models.Projects()).fetch({
        success: function(collection) {
            new views.Projects({
                el: $('#page'),
                collection: collection
            });
        }
    });
};
controller.prototype.project = function(id) {
    (new models.Project({ id: id })).fetch({
        success: function(model) {
            new views.Project({
                el: $('#page'),
                model: model
            });
        }
    });
};

