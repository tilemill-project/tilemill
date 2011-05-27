// LibraryList
// ------------
// Collection. All librarys.
model = Backbone.Collection.extend({
    model: models.Library,
    url: 'api/Library',
    comparator: function(model) {
        return model.get('name');
    }
});

