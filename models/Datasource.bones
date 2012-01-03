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
    if (Bones.server) return;

    var attr = this.attributes;
    if (this.getFeatures) attr.features = true;
    if (this.getInfo) attr.info = true;
    return 'http://'
        + window.abilities.tileUrl
        + '/datasource/'
        + this.get('id')
        + '?' + $.param(attr);
};

model.prototype.fetchFeatures = function(options) {
    this.getFeatures = true;
    this.fetch(options);
};

model.prototype.fetchInfo = function(options) {
    this.getInfo = true;
    this.fetch(options);
};
