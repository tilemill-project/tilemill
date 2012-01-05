view = Backbone.View.extend();

view.prototype.events = {
    'keyup .bboxForm input, input[name=width], input[name=height]': 'size',
    'click input[type=submit]': 'save',
    'click input.cancel': 'close'
};

view.prototype.initialize = function(options) {
    if (!options.model) throw new Error('No export model provided.');
    if (!options.project) throw new Error('No project model provided.');

    _(this).bindAll('render', 'remove', 'size', 'zoom', 'save', 'close');
    this.project = options.project;
    this.success = options.success || function() {};
    this.cancel = options.cancel || function() {};

    // Check whether an existing export with this ID exists and is in progress.
    Bones.utils.fetch({
        existing: new models.Export({id:this.model.id}),
        config: new models.Config()
    }, _(function(err, models) {
        if (err && err.status !== 404) {
            new views.Modal(err);
            return this.cancel();
        }
        if (!err && _(['processing','waiting']).include(models.existing.get('status'))) {
            new views.Modal(new Error('Export already in progress.'));
            return this.cancel();
        }
        this.config = models.config;
        this.render();
    }).bind(this));
};

view.prototype.render = function() {
    $(this.el).html(templates.Export(this));
    this.$('.slider').slider({
        range: true,
        min:0,
        max:22,
        values:[this.project.get('minzoom'), this.project.get('maxzoom')],
        step:1,
        slide: this.zoom
    });
    var center = this.project.get('center');
    this.map = new com.modestmaps.Map('export-map',
        new wax.mm.connector(this.project.attributes));

    wax.mm.zoomer(this.map).appendTo(this.map.parent);
    this.map.setCenterZoom(new com.modestmaps.Location(
        center[1],
        center[0]),
        center[2]);
    if (this.model.get('format') !== 'sync') {
        this.boxselector = wax.mm.boxselector(this.map, {}, _(function(data) {
            var s = _(data).chain().pluck('lat').min().value().toFixed(4);
            var n = _(data).chain().pluck('lat').max().value().toFixed(4);
            var w = _(data).chain().pluck('lon').min().value().toFixed(4) % 360;
            var e = _(data).chain().pluck('lon').max().value().toFixed(4) % 360;
            if (w < -180) w += 360; else if (w > 180) w -= 360;
            if (e < -180) e += 360; else if (e > 180) e -= 360;

            this.$('input[name=bbox_0]').val(w);
            this.$('input[name=bbox_1]').val(s);
            this.$('input[name=bbox_2]').val(e);
            this.$('input[name=bbox_3]').val(n);
            this.size();
        }).bind(this));
    }
    this.updateTotal();
    return this;
};

// Update size fields based on bbox ratio.
view.prototype.size = function(ev) {
    var nwLoc = new com.modestmaps.Location(
        this.$('input[name=bbox_3]').val(),
        this.$('input[name=bbox_0]').val()
    );
    var seLoc = new com.modestmaps.Location(
        this.$('input[name=bbox_1]').val(),
        this.$('input[name=bbox_2]').val()
    );
    var nw = this.map.locationPoint(nwLoc);
    var se = this.map.locationPoint(seLoc);
    var aspect = (Math.round(se.x) - Math.round(nw.x)) /
        (Math.round(se.y) - Math.round(nw.y));

    var target = $((ev || {}).currentTarget);
    if (target.attr('name') && target.attr('name').substring(0, 4) === 'bbox') {
        this.map.controls.boxselector.extent([nwLoc, seLoc], true);
    }

    switch (target.attr('name')) {
    case 'height':
        var h = parseInt(this.$('input[name=height]').val(), 10);
        if (_(h).isNumber() && _(aspect).isNumber())
            this.$('input[name=width]').val(Math.round(h * aspect));
        break;
    case 'width':
    default:
        var w = parseInt(this.$('input[name=width]').val(), 10);
        if (_(w).isNumber() && _(aspect).isNumber())
            this.$('input[name=height]').val(Math.round(w / aspect));
        break;
    };

    this.updateTotal();
};

view.prototype.remove = function() {
    $(this.el).html('');
};

view.prototype.formatThousands = function(num) {
    for (var num = parseInt(num, 0).toString(), i = num.length - 3; i > 0; i -= 3) {
        num = num.substring(0, i) + ',' + num.substring(i);
    }
    return num;
};

view.prototype.updateTotal = function(attributes) {
    if (this.model.get('format') === 'mbtiles' ||
        this.model.get('format') === 'sync') {
        var sm = new SphericalMercator;
        var attr = _(attributes || {}).defaults(this.getAttributes());
        var total = 0;

        // Retrieve defaults from model.
        attr.minzoom = attr.minzoom || this.project.get('minzoom');
        attr.maxzoom = attr.maxzoom || this.project.get('maxzoom');
        attr.bbox = attr.bbox || this.project.get('bounds');
        console.warn(attr);

        for (var z = attr.minzoom; z <= attr.maxzoom; z++) {
            var b = sm.xyz(attr.bbox, z);
            total += Math.abs((b.maxX - b.minX + 1) * (b.maxY - b.minY + 1));
        }
        this.$('.totaltiles').text(this.formatThousands(total));
        this.$('.totalsize').text((function(num) {
            num = num || 0;
            if (num >= 1e12) {
                return '1000 GB+';
            } else if (num >= 1e10) {
                return '100 GB+';
            } else if (num >= 1e9) {
                return '1 GB+';
            } else if (num >= 1e8) {
                return '100 MB+';
            } else if (num >= 1e7) {
                return '10 MB+';
            } else if (num >= 1e6) {
                return '1 MB+';
            } else {
                return '1 MB';
            }
        })(total * 1000));
    }
};

view.prototype.zoom = function(ev, ui) {
    this.$('.minzoom').text(ui.values[0]);
    this.$('.maxzoom').text(ui.values[1]);
    this.updateTotal({ minzoom: ui.values[0], maxzoom: ui.values[1] });
};

view.prototype.getAttributes = function() {
    if (this.model.get('format') === 'sync') return {
        id: this.project.id,
        name: (this.project.get('name') || this.project.id)
    };

    var attr = {};
    attr.filename = this.$('input[name=filename]').val()
        + '.' + this.model.get('format');
    attr.bbox = [
        parseFloat(this.$('input[name=bbox_0]').val()),
        parseFloat(this.$('input[name=bbox_1]').val()),
        parseFloat(this.$('input[name=bbox_2]').val()),
        parseFloat(this.$('input[name=bbox_3]').val())
    ];
    if (this.model.get('format') === 'mbtiles') {
        attr.minzoom = this.$('.slider').slider('values', 0);
        attr.maxzoom = this.$('.slider').slider('values', 1);
    } else {
        attr.width = parseInt(this.$('input[name=width]').val(), 10);
        attr.height = parseInt(this.$('input[name=height]').val(), 10);
    }
    return attr;
};

// Use `success` and `error` callbacks set on the view.
view.prototype.save = function() {
    this.model.save(this.getAttributes(), this);
    return false;
};

view.prototype.close = function() {
    this.cancel();
    return false;
};

