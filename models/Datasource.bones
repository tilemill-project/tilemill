// Datasource (read-only)
// ----------------------
// Model. Inspection metadata about a map layer. Use `fetchFeatures()` to do
// a datasource fetch that includes layer feature objects.
model = Backbone.Model.extend({});

// @TODO either as a feature or a bug, object attributes are not set
// automatically when passed to the constructor. We set it manually here.
model.prototype.initialize = function(attributes, options) {
    this.set({'fields': attributes.fields});
    this.options = options;
};

model.prototype.url = function() {
    var url = '/api/Datasource/' + this.get('id');
    var attr = this.attributes;
    if (this.getFeatures) attr.features = true;
    if (!Bones.server) url += '?' + $.param(attr);
    return url;
};

model.prototype.fetchFeatures = function(options) {
    this.getFeatures = true;
    this.fetch(options);
};
