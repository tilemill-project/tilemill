view = Backbone.View.extend();

view.prototype.events = {
    'click a.upload': 'upload'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render');

    (new models.Preview({id:this.model.get('filename')})).fetch({
        success: _(function(model, resp) {
            this.preview = model;
            this.render();
        }).bind(this),
        error: function(m, e) { new views.Modal(e) }
    });
};

view.prototype.render = function() {
    this.$('.content').html(templates.Preview(this.model));

    if (!com.modestmaps) throw new Error('ModestMaps not found.');
    this.map = new com.modestmaps.Map('preview',
        new wax.mm.connector(this.preview.attributes));
    wax.mm.interaction(this.map, this.preview.attributes);
    wax.mm.legend(this.map, this.preview.attributes).appendTo(this.map.parent);
    wax.mm.zoombox(this.map);
    wax.mm.zoomer(this.map).appendTo(this.map.parent);

    var center = this.preview.get('center');
    this.map.setCenterZoom(new com.modestmaps.Location(
        center[1],
        center[0]),
        center[2]);

    return this;
};

view.prototype.upload = function(ev) {
    (new models.Export({
        filename: this.model.get('filename'),
        project: this.model.get('project'),
        format: 'upload'
    }).save({}, {
        success: _(function(model) {
            this.collection.add(model);
            $('a.close', this.el).click();
        }).bind(this)
    }));
    return false;
};
