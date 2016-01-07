model = Backbone.Collection.extend();

model.prototype.url = '/api/Plugin';

model.prototype.comparator = function(plugin) {
    return plugin.get('name');
};
