view = Backbone.View.extend();

view.prototype.events = {};

view.prototype.initialize = function(options) {
    _(this).bindAll('render');
    this.render();
};

view.prototype.render = function() {
    console.log(this.model);
    this.$('.content').html(templates.Layer(this.model));
    return this;
};

