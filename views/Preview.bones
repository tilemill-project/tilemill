view = Backbone.View.extend();

view.prototype.initialize = function(options) {
    _(this).bindAll('render');
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Preview(this.model));

    if (!com.modestmaps) throw new Error('ModestMaps not found.');
    this.map = new com.modestmaps.Map('preview',
        new wax.mm.connector(this.model.attributes));
    wax.mm.interaction(this.map, this.model.attributes);
    wax.mm.legend(this.map, this.model.attributes).appendTo(this.map.parent);
    wax.mm.zoombox(this.map);
    wax.mm.zoomer(this.map).appendTo(this.map.parent);

    var center = this.model.get('center');
    this.map.setCenterZoom(new com.modestmaps.Location(
        center[1],
        center[0]),
        center[2]);

    return this;
};

