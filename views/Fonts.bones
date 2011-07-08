view = Backbone.View.extend();

view.prototype.initialize = function(options) {
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html('@TODO');
    return this;
};
