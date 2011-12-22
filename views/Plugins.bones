view = Backbone.View.extend();

view.prototype.events = {};

view.prototype.initialize = function(options) {
    _(this).bindAll('render');
    this.render();
};

view.prototype.render = function() {
    $('.bleed .active').removeClass('active');
    $('.bleed .plugins').addClass('active');
    this.el.html(templates.Plugins());
    return this;
};

