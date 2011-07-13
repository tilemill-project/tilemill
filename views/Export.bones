view = Backbone.View.extend();

view.prototype.initialize = function(options) {
    if (!options.type) throw new Error('No export type specified.');
    if (!options.model) throw new Error('No project model provided.');

    this.type = options.type;
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Export(this));
    return this;
};

