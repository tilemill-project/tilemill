model = Backbone.Collection.extend({
    model: models.Page,
    url: '/api/Page',
    comparator: function(m) { return m.id }
});
