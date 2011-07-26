// ProjectList
// -----------
// Collection. All project models.
model = Backbone.Collection.extend({
    model: models.Project,
    url: '/api/Project',
    comparator: function(project) {
        return project.get('id').toLowerCase();
    }
});

