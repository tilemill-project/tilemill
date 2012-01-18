view = Backbone.View.extend();

view.prototype.events = {
    'click a.upload': 'upload'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render');

    Bones.utils.fetch({
        preview: new models.Preview({id:this.model.get('filename')}),
        config: new models.Config()
    }, _(function(err, models) {
        if (err) return new views.Modal(err);
        this.preview = models.preview;
        this.config = models.config;
        this.render();
    }).bind(this));
};

view.prototype.render = function() {
    this.$('.content').html(templates.Preview({
        model: this.model,
        config: this.config
    }));

    if (!MM) throw new Error('ModestMaps not found.');
    this.map = new MM.Map('preview',
        new wax.mm.connector(this.preview.attributes));
    wax.mm.interaction(this.map, this.preview.attributes);
    wax.mm.legend(this.map, this.preview.attributes).appendTo(this.map.parent);
    wax.mm.zoombox(this.map);
    wax.mm.zoomer(this.map).appendTo(this.map.parent);

    var center = this.preview.get('center');
    this.map.setCenterZoom(new MM.Location(
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
