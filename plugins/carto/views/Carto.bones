view = Backbone.View.extend();

view.prototype.events = {
    'click .toggler a': 'toggler'
}

view.prototype.initialize = function(options) {
    this.render();
    this._carto_state = options._carto_state;
    if (this._carto_state.section) {
        $('a[href=' + this._carto_state.section + ']').click();
    }
};

view.prototype.toggler = function(ev) {
    this._carto_state.section = $(ev.currentTarget).attr('href');
};

view.prototype.render = function() {
    if (this.$('.manual').size()) return this;

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    allColors = abilities.carto.colors;
    colorKeys = Object.keys(allColors);
    var colors = _(colorKeys).map(function(color) {
        var rgb = allColors[color];
        var rgbObj = {R:rgb[0], G:rgb[1], B:rgb[2]};
        var hex = rgbToHex.apply(this,rgb);
        var hsv = Color.RGB_HSV(rgbObj);
        return { name:color, rgbcode:rgb, hexcode:hex, hsvcode:hsv };
    });
    var colorsSorted = _.sortBy(colors,function(c) { return -c.hsvcode.H; });

    this.$('.content').html(templates.Reference({
        symbolizers: abilities.carto.symbolizers,
        colors: colors,
        colorsSorted: colorsSorted
    }));
    return this;
};

// Hook in to project view with an augment.
views.Project.augment({
    events: { 'click a[href=#carto]': 'carto' },
    carto: function() {
        new view({
            el:$('#drawer'),
            _carto_state: this._carto_state
        })
    },
    initialize: function(p, o) {
        _(this).bindAll('carto');
        // Minor state saving for the carto window
        this._carto_state = {};
        return p.call(this, o);
    },
    render: function(p) {
        p.call(this);
        this.$('.palette').prepend("<a class='drawer' title='Carto Reference' href='#carto'><span class='icon reverse reference'>Carto Reference v"+abilities.carto.version+"</span></a>");
        return this;
    }
});

