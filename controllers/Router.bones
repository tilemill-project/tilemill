controller = Backbone.Controller.extend({
    initialize: function() {},
    routes: {
        '': 'projects',
        '/': 'projects',
//        '/project/:id': 'project'
    },
    projects: function() {
        (new models.Projects()).fetch({
            success: function(collection) {
                new views.Projects({
                    el: $('#app'),
                    collection: collection
                });
            }
        });
    },
//    project: function(id) {
//        (new models.Project({ id: id })).fetch({
//            success: function(model) {
//                new view.Project({
//                    el: $('#app'),
//                    model: model
//                });
//            }
//        });
//    }
});

