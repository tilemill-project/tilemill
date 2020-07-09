// Exports
// -------
// Collection. List of all Exports.
model = Backbone.Collection.extend({});

model.prototype.model = models.Export;
model.prototype.url = '/api/Export';
model.prototype.comparator = function(m) { return m.get('created') * -1; }
