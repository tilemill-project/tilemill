view = Backbone.View.extend();

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
    this.map.controls.zoombox.remove();
    this.map.controls.boxselector = wax.mm.boxselector(this.map, {}, _(function(data) {
        var s = _(data).chain().pluck('lat').min().value().toFixed(2);
        var n = _(data).chain().pluck('lat').max().value().toFixed(2);
        var w = _(data).chain().pluck('lon').min().value().toFixed(2);
        var e = _(data).chain().pluck('lon').max().value().toFixed(2);
        this.$('input.s').val(n);
        this.$('input.n').val(w);
        this.$('input.w').val(w);
        this.$('input.e').val(e);
    }).bind(this));
    return this;
};

view.prototype.remove = function() {
    this.map.controls.boxselector.remove();
    this.map.controls.zoombox.add(this.map);
};

