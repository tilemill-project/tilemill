// Doc
// ---
// Model. Retrieve a text doc page from the server.
model = Backbone.Model.extend({});
model.prototype.url = function() { return '/api/Page/' + this.get('id'); };
