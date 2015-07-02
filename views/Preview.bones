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
    this.preview.attributes.scheme = 'tms';
    this.map = new MM.Map('preview',
        new wax.mm.connector(this.preview.attributes));
    wax.mm.interaction()
        .map(this.map)
        .tilejson(this.preview.attributes)
        .on(wax.tooltip().parent(this.map.parent).events());
    wax.mm.legend(this.map, this.preview.attributes).appendTo(this.map.parent);
    wax.mm.zoombox(this.map);
    wax.mm.zoomer(this.map).appendTo(this.map.parent);

    var center = this.preview.get('center');
    this.map.setCenterZoom(new MM.Location(
        center[1],
        center[0]),
        center[2]);

    this.map.setZoomRange(
        this.model.get('minzoom'),
        this.model.get('maxzoom'));

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

view.prototype.download = function(ev) {
    if (typeof process === 'undefined') return;
    if (typeof process.versions['atom-shell'] === undefined) return;
    var uri = url.parse($(ev.currentTarget).attr('href'));
        // Opening external URLs.
    if (uri.hostname && uri.hostname !== 'localhost') {
        shell.openExternal(ev.currentTarget.href);
        return false;
    }
    // File saving.
    var fileTypes = {
        mbtiles: 'Tiles',
        png: 'Image',
        jpg: 'Image',
        jpeg: 'Image',
        tiff: 'Tiff',
        webp: 'WebP',
        pdf: 'PDF',
        svg: 'SVG',
        xml: 'Mapnik XML'
    };

    var typeExtension = (uri.pathname || '').split('.').pop().toLowerCase();
    var typeLabel = fileTypes[typeExtension];

    if (typeLabel) {
        var filePath = remote.require('dialog').showSaveDialog({
            title: 'Save ' + typeLabel,
            defaultPath: '~/Untitled ' + typeLabel + '.' + typeExtension,
            filters: [{
                name: typeExtension.toUpperCase(),
                extensions: [typeExtension]
            }]
        });
        if (filePath) {
            var writeStream = fs.createWriteStream(filePath);
            var req = http.request(uri, function(res) {
                if (res.statusCode !== 200) return;
                res.pipe(writeStream);
            });
            req.end();
        }
        return false;
    }
};
