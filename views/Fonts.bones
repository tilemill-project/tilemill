view = Backbone.View.extend();

view.prototype.events = {
    'click a.font': 'insert'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('insert');
    this.render();
};

view.prototype.render = function() {
    if (this.$('.fonts').size()) return this;
    var groups = {};
    var fonts = _(abilities.fonts).map(function(font) {
        var group = font.toUpperCase().charCodeAt(0);
        groups[group] = groups[group] || 0;
        groups[group]++
        return { name:font, group:group };
    });
    this.$('.content').html(templates.Fonts({
        fonts: fonts,
        groups: groups
    }));
    return this;
};

view.prototype.insert = function(ev) {
    alert('@TODO');
    return false;
};

