// Stylesheets
// -----------
// Collection. List of Stylesheet models. This collection is a child of the
// Project model and updates its parent on update events.
// **This collection is not backed directly by the server.**
model = Backbone.Collection.extend({});

model.prototype.model = models.Stylesheet;

model.prototype.initialize = function(models, options) {
    var that = this;
    this.parent = options.parent;
    this.bind('change', function() {
        this.parent.set({ 'Stylesheet': that });
        this.parent.change();
    });
    this.bind('add', function() {
        this.parent.set({ 'Stylesheet': that });
        this.parent.change();
    });
    this.bind('remove', function() {
        this.parent.set({ 'Stylesheet': that });
        this.parent.change();
    });
};
