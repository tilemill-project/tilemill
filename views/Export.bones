view = Backbone.View.extend();

view.prototype.events = {
    'keyup .bboxForm input, input[name=width], input[name=height]': 'size',
};

view.prototype.initialize = function(options) {
    if (!options.map) throw new Error('No map provided.');
    if (!options.type) throw new Error('No export type specified.');
    if (!options.model) throw new Error('No project model provided.');

    _(this).bindAll('render', 'remove', 'size');
    this.map = options.map;
    this.type = options.type;
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Export(this));
    this.map.controls.zoombox.remove();
    this.map.controls.boxselector = wax.mm.boxselector(this.map, {}, _(function(data) {
        var s = _(data).chain().pluck('lat').min().value().toFixed(2);
        var n = _(data).chain().pluck('lat').max().value().toFixed(2);
        var w = _(data).chain().pluck('lon').min().value().toFixed(2) % 360;
        var e = _(data).chain().pluck('lon').max().value().toFixed(2) % 360;
        if (w < -180) w += 360; else if (w > 180) w -= 360;
        if (e < -180) e += 360; else if (e > 180) e -= 360;

        this.$('input[name=bbox_0]').val(w);
        this.$('input[name=bbox_1]').val(s);
        this.$('input[name=bbox_2]').val(e);
        this.$('input[name=bbox_3]').val(n);
        this.size();
    }).bind(this));
    return this;
};

// Update size fields based on bbox ratio.
view.prototype.size = function(ev) {
    var nw = this.map.locationPoint(new com.modestmaps.Location(
        this.$('input[name=bbox_3]').val(),
        this.$('input[name=bbox_0]').val()
    ));
    var se = this.map.locationPoint(new com.modestmaps.Location(
        this.$('input[name=bbox_1]').val(),
        this.$('input[name=bbox_2]').val()
    ));
    var aspect = (Math.round(se.x) - Math.round(nw.x)) /
        (Math.round(se.y) - Math.round(nw.y));

    // @TODO if ev is width/height we need to redraw the boxselector.
    // See https://github.com/mapbox/wax/issues/81
    var target = $((ev || {}).currentTarget);
    switch (target.attr('name')) {
    case 'height':
        var h = parseInt(this.$('input[name=height]').val(), 10);
        if (_(h).isNumber() && _(aspect).isNumber())
            this.$('input[name=width]').val(Math.round(h /aspect));
        break;
    case 'width':
    default:
        var w = parseInt(this.$('input[name=width]').val(), 10);
        if (_(w).isNumber() && _(aspect).isNumber())
            this.$('input[name=height]').val(Math.round(w * aspect));
        break;
    };
};

view.prototype.remove = function() {
    this.map.controls.boxselector.remove();
    this.map.controls.zoombox.add(this.map);
};

