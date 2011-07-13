view = Backbone.View.extend();

view.prototype.events = {
    'click input.cancel': 'remove'
};

view.prototype.initialize = function(options) {
    if (!options.map) throw new Error('No map provided.');
    if (!options.type) throw new Error('No export type specified.');
    if (!options.model) throw new Error('No project model provided.');

    _(this).bindAll('render', 'remove');
    this.map = options.map;
    this.type = options.type;
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Export(this));
    return this;
};

view.prototype.remove = function() {
    // Remove any attached handlers here.
};

