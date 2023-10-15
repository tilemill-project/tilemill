view = Backbone.View.extend();

view.prototype.events = {
    'click a.color': 'insert',
    'keydown a.color input': 'keydown'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('insert', 'keydown');
    this.render();
};

view.prototype.render = function() {
    if (this.$('.colors').size()) return this;
    var groups = {};
    allColors = abilities.carto.colors;
    colorKeys = Object.keys(allColors);

    var colors = _(colorKeys).map(function(color) {
        var group = color.toUpperCase().charCodeAt(0);
        groups[group] = groups[group] || 0;
        groups[group]++
        var code = allColors[color];
        return { name:color, group:group, rgbcode:code };
    });
    this.$('.content').html(templates.Colors({
        colors: colors,
        groups: groups
    }));
    return this;
};

// Select color text.
view.prototype.insert = function(ev) {
    var target = $(ev.currentTarget);
    target.addClass('insert').siblings().removeClass('insert');
    $('input', target).select();
    return false;
};

// Catch non-action keypress (e.g. Ctrl-C) events when a color input field
// is selected to prevent users from tampering with a color name.
view.prototype.keydown = function(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    return false;
}

// Hook in to projet view with an augment.
views.Project.augment({
    events: { 'click a[href=#colors]': 'colors' },
    colors: function() {
        new view({ el:$('#drawer') })
    },
    render: function(p) {
        p.call(this);
        this.$('.palette').prepend("<a class='drawer' href='#colors'><span class='icon reverse color-picker'>Colors</span></a>");
        return this;
    }
});

