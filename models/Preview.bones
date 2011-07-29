// Preview of an mbtiles export.
model = Backbone.Model.extend({});
model.prototype.url = function() { return '/api/Preview/' + this.id; };
