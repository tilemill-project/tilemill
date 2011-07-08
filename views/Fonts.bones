view = Backbone.View.extend();

view.prototype.events = {
    'click .links a': 'filter',
    'click a.font': 'insert'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('filter', 'insert');
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

view.prototype.filter = function(ev) {
    var target = $(ev.currentTarget);
    var group = target.attr('href').split('#').pop();
    this.$('.links a.active').removeClass('active');
    this.$('.fonts .font').hide();
    this.$('.fonts .group-' + group).show();
    target.addClass('active');
    return false;
};

view.prototype.insert = function(ev) {
    alert('@TODO');
    return false;
};

