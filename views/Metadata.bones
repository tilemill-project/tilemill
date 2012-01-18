view = Backbone.View.extend();

view.prototype.events = {
    'slidechange .slider': 'updateTotal',
    'change select[name=format]': 'updateCustom',
    'keyup input[name=bounds],\
        input[name=width],\
        input[name=height]': 'updateSize',
    'change input[name=bounds],\
        input[name=width],\
        input[name=height]': 'updateSize',
    'click input[type=submit]': 'save',
    'click .cancel': 'close'
};

view.prototype.initialize = function(options) {
    if (!options.type) throw new Error('No type provided.');
    if (!options.model) throw new Error('No export model provided.');
    if (!options.project) throw new Error('No project model provided.');

    _(this).bindAll(
        'render',
        'close',
        'save',
        'mapZoom',
        'updateCustom',
        'updateTotal',
        'updateSize');
    this.sm = new SphericalMercator;
    this.type = options.type;
    this.title = options.title;
    this.project = options.project;
    this.success = options.success || function() {};
    this.cancel = options.cancel || function() {};

    // No need to load or check anything if editing project.
    if (this.project === this.model) return this.render();

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

view.prototype.close = function() {
    this.cancel();
    return false;
};

view.prototype.render = function() {
    $(this.el).html(templates.Metadata(this));

    this.model.set({zooms:[
        this.project.get('minzoom'),
        this.project.get('maxzoom')
    ]}, {silent:true});
    Bones.utils.sliders(this.$('.slider'), this.model);

    var center = this.project.get('center');
    var bounds = this.project.get('bounds');
    var extent = [
        new MM.Location(bounds[1], bounds[0]),
        new MM.Location(bounds[3], bounds[2])
    ];
    // Override project attributes to allow unbounded zooming.
    var tj = _(this.project.attributes).clone();
    tj.minzoom = 0;
    tj.maxzoom = 22;
    this.map = new MM.Map('meta-map', new wax.mm.connector(tj));

    wax.mm.zoomer(this.map).appendTo(this.map.parent);
    this.map.setExtent(extent);

    if (this.$('input[name=bounds]').size()) {
        this.boxselector = wax.mm.boxselector(this.map, {}, _(function(data) {
            var s = _(data).chain().pluck('lat').min().value().toFixed(4);
            var n = _(data).chain().pluck('lat').max().value().toFixed(4);
            var w = _(data).chain().pluck('lon').min().value().toFixed(4) % 360;
            var e = _(data).chain().pluck('lon').max().value().toFixed(4) % 360;
            if (w < -180) w += 360; else if (w > 180) w -= 360;
            if (e < -180) e += 360; else if (e > 180) e -= 360;
            this.$('input[name=bounds]').val([w,s,e,n].join(','));
            if (this.$('input[name=width]').size()) this.updateSize();
            if (this.$('.slider').size()) this.updateTotal();
        }).bind(this));
        this.boxselector.extent(extent);
    }
    if (this.$('input[name=center]').size()) {
        var first = true;
        this.pointselector = wax.mm.pointselector(this.map, {}, _(function(data) {
            var point = data.pop();
            var x = point.lon.toFixed(4) % 360;
            var y = point.lat.toFixed(4);
            var z = first ? center[2] : this.map.getZoom();
            if (x < -180) x += 360; else if (x > 180) x -= 360;
            this.$('input[name=center]').val([x,y,z].join(','));

            var loc = this.pointselector.locations();
            while (loc.length > 1) {
                this.pointselector.deleteLocation(loc[0]);
                loc = this.pointselector.locations();
            }
            $(loc[0].pointDiv).text('Z'+z);
            first = false;
        }).bind(this));
        this.pointselector.addLocation(new MM.Location(center[1],center[0]));
    }

    // Update state of custom format field.
    if (this.$('select[name=format]').size()) this.updateCustom();

    // Update total tiles
    if (this.$('.slider').size()) this.updateTotal();

    // Set up map zoom display.
    this.map.addCallback('zoomed', this.mapZoom);
    this.map.addCallback('panned', this.mapZoom);
    this.map.addCallback('extentset', this.mapZoom);
    this.mapZoom({element: this.map.div});

    return this;
};

// Set zoom display.
view.prototype.mapZoom = function(e) {
    this.$('.zoom-display .zoom').text(this.map.getZoom());
};

view.prototype.updateCustom = function(ev) {
    if (this.$('select[name=format]').val() === '') {
        this.$('.dependent').show();
    } else {
        this.$('.dependent').hide();
    }
};

view.prototype.updateTotal = function(attributes) {
    var sm = this.sm;
    var attr = Bones.utils.form(this.$('form'), this.model);
    var bbox = _(attr.bounds.split(',')).map(parseFloat);
    var total = _(_.range(attr.zooms[0],attr.zooms[1]+1)).reduce(function(memo, z) {
        var b = sm.xyz(bbox, z);
        memo += Math.abs((b.maxX - b.minX + 1) * (b.maxY - b.minY + 1));
        return memo;
    }, 0);
    this.$('.totaltiles').text((function(num) {
        for (var num = parseInt(num, 0).toString(), i = num.length - 3; i > 0; i -= 3) {
            num = num.substring(0, i) + ',' + num.substring(i);
        }
        return num;
    })(total));
    this.$('.totalsize').text((function(num) {
        num = num || 0;
        if (num >= 1e12) return '1000 GB+';
        if (num >= 1e10) return '100 GB+';
        if (num >= 1e9) return '1 GB+';
        if (num >= 1e8) return '100 MB+';
        if (num >= 1e7) return '10 MB+';
        if (num >= 1e6) return '1 MB+';
        return '1 MB';
    })(total * 1000));
};

// Update size fields based on bbox ratio.
view.prototype.updateSize = function(ev) {
    var bounds = _(this.$('input[name=bounds]').val().split(',')).map(parseFloat);
    var nwLoc = new MM.Location(bounds[3], bounds[0]);
    var seLoc = new MM.Location(bounds[1], bounds[2]);
    var nw = this.map.locationPoint(nwLoc);
    var se = this.map.locationPoint(seLoc);
    var aspect = (Math.round(se.x) - Math.round(nw.x)) /
        (Math.round(se.y) - Math.round(nw.y));

    var target = $((ev || {}).currentTarget);
    if (target.attr('name') && target.attr('name') === 'bounds')
        this.boxselector.extent([nwLoc, seLoc], true);

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
    // Update total tiles.
    if (this.type === 'tiles') this.updateTotal();
};

view.prototype.save = function() {
    var attr = Bones.utils.form(this.$('form'), this.model);
    var save = attr._saveProject;
    var error = function(m, e) { new views.Modal(e); };

    // Massage values.
    if (attr.filename) attr.filename = attr.filename + '.' + this.model.get('format');
    if (attr.bounds) attr.bounds = _(attr.bounds.split(',')).map(parseFloat);
    if (attr.center) attr.center = _(attr.center.split(',')).map(parseFloat);
    if (attr.zooms) attr.minzoom = attr.zooms[0];
    if (attr.zooms) attr.maxzoom = attr.zooms[1];
    if (attr.format || attr.format_custom) attr.format = attr.format || attr.format_custom;
    if (attr.height) attr.height = parseInt(attr.height,10);
    if (attr.width) attr.width = parseInt(attr.width,10);
    delete attr.zooms;
    delete attr.format_custom;
    delete attr._saveProject;
    attr = _(attr).reduce(function(memo, val, key) {
        var allowEmpty = ['description', 'attribution'];
        if (val !== '' || _(allowEmpty).include(key)) memo[key] = val;
        return memo;
    }, {});

    // Project settings.
    if (this.model === this.project) {
        if (!this.project.set(attr, {error:error})) return false;
        this.project.save({}, { success:this.success, error:error});
        return false;
    }

    // Exports.
    switch (this.model.get('format')) {
    case 'sync':
        if (!this.model.set({
            id: this.project.id,
            name: this.project.get('name') || this.project.id
        }, {error:error})) return false;
        break;
    case 'mbtiles':
        if (!this.model.set({
            filename: attr.filename,
            bbox: attr.bounds,
            minzoom: attr.minzoom,
            maxzoom: attr.maxzoom
        }, {error:error})) return false;
        break;
    case 'png':
    case 'pdf':
    case 'svg':
        if (!this.model.set({
            filename: attr.filename,
            bbox: attr.bounds,
            width: attr.width,
            height: attr.height
        }, {error:error})) return false;
        break;
    }

    // Just save the export.
    if (!save) return this.model.save({}, this) && false;

    // Save export and then project.
    delete attr.filename;
    delete attr.width;
    delete attr.height;
    if (!this.project.set(attr, {error:error})) return false;
    Bones.utils.serial([
    _(function(next) {
        this.model.save({}, { success:next, error:this.error });
    }).bind(this),
    _(function(next) {
        this.project.save({}, this);
    }).bind(this)]);
    return false;
};

