view = Backbone.View.extend();

view.prototype.initialize = function(options) {
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Exports(this.collection));
    return this;
};

