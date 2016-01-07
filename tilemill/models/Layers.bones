// Layers
// ------
// Collection. List of Layer models. This collection is a child of the
// Project model and updates its parent on update events.
// **This collection is not backed directly by the server.**
model = Backbone.Collection.extend({});

model.prototype.model = models.Layer;

model.prototype.initialize = function(models, options) {
    var that = this;
    var change = function() {
        this.parent.set({ 'Layer': that });
        this.parent.change();
    };
    this.parent = options.parent;
    this.bind('refresh', change);
    this.bind('change', change);
    this.bind('add', change);
    this.bind('remove', change);
};
