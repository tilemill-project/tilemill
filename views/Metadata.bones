view = Backbone.View.extend();

view.prototype.events = {
    'slidechange .slider': 'updateSlider',
    'change select[name=format]': 'updateCustomFormat',
    'keyup input[name=bounds],\
        input[name=width],\
        input[name=height]': 'updateSize',
    'change input[name=bounds],\
        input[name=printedwidth],\
        input[name=width],\
        input[name=featurepixels],\
        input[name=height]': 'updateSize',
    'click input[type=submit]': 'save',
    'click .cancel': 'close',
    'change select.maplayer-selection' : 'selectLayer',
    'change input[name=aspectwidth],\
        input[name=setaspect],\
        input[name=aspectheight]': 'setAspect'
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
        'updatePreview',
        'updateCustomFormat',
        'updateTotal',
        'updateSlider',
        'updateSize',
        'selectLayer',
        'setAspect');
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
    if (this.model.get('format') !== 'sync' ||
        (this.config.get('syncAccount') && this.config.get('syncAccessToken'))) {
        $(this.el).html(templates.Metadata(this));
    }

    var center = (this.model.get('center') !== undefined) ? this.model.get('center') : this.project.get('center');
    var bounds = (this.model.get('bbox') !== undefined) ? this.model.get('bbox') : this.project.get('bounds');

    this.model.set({
        zooms: this.model.get('zooms') !== undefined ? this.model.get('zooms') : [
            this.project.get('minzoom'),
            this.project.get('maxzoom')],
        metatile: this.model.get('metatile') !== undefined ? this.model.get('metatile') :this.project.get('metatile'),
        center: center,
        bounds: bounds,
        static_zoom: this.model.get('static_zoom') !== undefined ? this.model.get('static_zoom') : center[2]
    }, {silent:true});

    Bones.utils.sliders(this.$('.slider'), this.model);

    var extent = [
        new MM.Location(bounds[1], bounds[0]),
        new MM.Location(bounds[3], bounds[2])
    ];
    var tj = _(this.project.attributes).clone();
    tj.minzoom = 0;
    tj.maxzoom = 22;
    tj.center = center;
    this.map = new MM.Map('meta-map', new wax.mm.connector(tj));

    // Override project attributes to allow unbounded zooming.
    this.map.setZoomRange(
        tj.minzoom,
        tj.maxzoom);

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
            if (this.$('.slider .range').size()) this.updateTotal();
        }).bind(this));
        this.$('input[name=setaspect]').attr('checked', false);
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
        // Give pointselector a chance to register a mouseDown handler for the box.
        this.pointselector.addBoxselector(this.boxselector);
    }

    // Update state of custom format field.
    if (this.$('select[name=format]').size()) this.updateCustomFormat();

    // Update total tiles
    if (this.$('.slider .range').size()) this.updateTotal();

    // Set up map zoom display.
    this.map.addCallback('zoomed', this.mapZoom);
    this.map.addCallback('panned', this.mapZoom);
    this.map.addCallback('extentset', this.mapZoom);
    this.mapZoom({element: this.map.div});

    this.updatePreview();

    $("#meta-map .zoom-display").css({
        top: "63px",
        width: "120px"
    });

    return this;
};

// Set zoom display.
view.prototype.mapZoom = function(e) {
    this.$('.zoom-display .zoom').text(this.map.getZoom());
};

view.prototype.updateCustomFormat = function(ev) {
    if (this.$('select[name=format]').val() === '') {
        this.$('.dependent').show();
    } else {
        this.$('.dependent').hide();
    }
};

view.prototype.updatePreview = function() {
    var attr = Bones.utils.form(this.$('form'), this.model);
    var req = 'http://' + window.abilities.tileUrl;
    req += '/tile/' + this.project.id + '/image?';
    req += 'width='+attr.width;
    req += '&height='+attr.height;
    req += '&bbox='+attr.bounds;
    req += "&static_zoom="+attr.static_zoom;
    var encoded = encodeURI(req);
    var wrap = '<a href="' + encoded + '" target="_blank"><img src="' + encoded +'" width="95%" /></a>';
    this.$('.preview_image').html(wrap);
}

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
        if (num >= 1e12) {
            this.$('.totalsize').addClass('warning-red');
            return '1000 GB+ reducing zoom level recommended';
        }
        if (num >= 1e10) {
            this.$('.totalsize').addClass('warning-red');
            return '100 GB+ reducing zoom level recommended';
        }
        if (num >= 1e9) {
            this.$('.totalsize').addClass('warning-red');
            return '1 GB+ reducing zoom level recommended';
        }
        if (num >= 1e8) {
            this.$('.totalsize').removeClass('warning-red');
            return '100 MB+';
        }
        if (num >= 1e7) {
            this.$('.totalsize').removeClass('warning-red');
            return '10 MB+';
        }
        if (num >= 1e6) {
            this.$('.totalsize').removeClass('warning-red');
            return '1 MB+';
        }
        return '1 MB';
    })(total * 1000));
};

// Update size fields based on bbox ratio.
view.prototype.updateSize = function(ev) {
    var bounds = _(this.$('input[name=bounds]').val().split(',')).map(parseFloat);
    var attr = Bones.utils.form(this.$('form'), this.model);
    var nwLoc = new MM.Location(bounds[3], bounds[0]);
    var seLoc = new MM.Location(bounds[1], bounds[2]);
    var neLoc = new MM.Location(bounds[3], bounds[2]);
    var nw = this.map.locationPoint(nwLoc);
    var se = this.map.locationPoint(seLoc);
    var aspect = (Math.round(se.x) - Math.round(nw.x)) /
        (Math.round(se.y) - Math.round(nw.y));

    var target = $((ev || {}).currentTarget);

    // Switch based upon which field was changed
    switch (target.attr('name')) {
    case 'bounds':
        this.$('input[name=setaspect]').attr('checked', false);
        this.boxselector.extent([nwLoc, seLoc], true);
        break;    
    case 'height':
        var h = parseInt(this.$('input[name=height]').val(), 10);
        if (_(h).isNumber() && _(aspect).isNumber())
            this.$('input[name=width]').val(Math.round(h * aspect));
        break;
    case 'width':
        var w = parseInt(this.$('input[name=width]').val(), 10);
        if (_(w).isNumber() && _(aspect).isNumber())
            this.$('input[name=height]').val(Math.round(w / aspect));
        break;
    default:
    };

    /*  These get executed regardless of what caused the change */

    // Update Size Height field, keep width constant
    var w = parseInt(this.$('input[name=width]').val(), 10);
    if (_(w).isNumber() && _(aspect).isNumber())
        this.$('input[name=height]').val(Math.round(w / aspect));

    // Update aspect ratio fields
    if (!attr.setaspect) {
        var aspectwidth_cur = parseFloat(this.$('input[name=aspectwidth]').val());
        this.$('input[name=aspectheight]').val((aspectwidth_cur / aspect).toFixed(1));
    }

    // Update scale & distances fields
    var pixelSize = .00035;
    var dpi = 72;
    var distances = this.boxselector.distances(nwLoc, seLoc);
    var scale = distances.x / ( parseFloat(this.$('input[name=printedwidth]').val()) * pixelSize * dpi);
    this.$('input[name=scale]').val(scale.toFixed(0));
    this.$('input[name=boxWidth]').val(distances.x.toFixed(1));
    this.$('input[name=boxHeight]').val(distances.y.toFixed(1));

    // Update feature size fields
    var featurepixels = parseFloat(this.$('input[name=featurepixels]').val());
    var printedwidth = parseFloat(this.$('input[name=printedwidth]').val());
    this.$('input[name=featureprinted]').val((featurepixels * printedwidth / w).toFixed(3));

    // Update total tiles.
    if (this.type === 'tiles') this.updateTotal();
    else this.updatePreview();
};

// Fix the bbox size based upon entered aspect ratio.
view.prototype.setAspect = function(ev) {
    this.$('input[name=aspectwidth]').attr('disabled', false);
    this.$('input[name=aspectheight]').attr('disabled', false);
    this.$('input[name=bounds]').attr('disabled', true);
    var attr = Bones.utils.form(this.$('form'), this.model);
    if (!attr.setaspect) {
        this.$('input[name=bounds]').attr('disabled', false);
        this.$('input[name=aspectwidth]').attr('disabled', true);
        this.$('input[name=aspectheight]').attr('disabled', true);
        return false;
    };

    // Get drawn extent coordinates
    var bounds = _(this.$('input[name=bounds]').val().split(',')).map(parseFloat);
    var nwLoc = new MM.Location(bounds[3], bounds[0]);
    var seLoc = new MM.Location(bounds[1], bounds[2]);
    var nw = this.map.locationPoint(nwLoc);
    var se = this.map.locationPoint(seLoc);

    // Set aspect
    // Fix the left-edge of bounding box, adjust right-edge
    var aspectwidth = parseFloat(this.$('input[name=aspectwidth]').val());
    var aspectheight = parseFloat(this.$('input[name=aspectheight]').val());
    var aspect = (aspectheight / aspectwidth).toFixed(4);
    //var aspect = 1.2941;  //Paper 8.5x11 size

    shiftX = ((Math.round(se.y) - Math.round(nw.y)) / aspect);
    se.x = (Math.round(nw.x) + shiftX).toFixed(4);
    seLoc = this.map.pointLocation(se);
    // Remove extra decimals that get added
    seLoc.lat = (seLoc.lat).toFixed(4);

    // Update bounding box field, redraw bounding extent
    this.$('input[name=bounds]').val([nwLoc.lon,seLoc.lat,seLoc.lon,nwLoc.lat].join(','));
    this.boxselector.extent([nwLoc, seLoc], true);
    this.updateSize();

    // Update total tiles if mbtiles, otherwise update the preview
    if (this.type === 'tiles') this.updateTotal();
    else this.updatePreview();
};

view.prototype.updateSlider = function() {
    if (this.type === 'tiles') this.updateTotal();
    else this.updatePreview();
};

view.prototype.save = function() {
    var attr = Bones.utils.form(this.$('form'), this.model);
    var save = attr._saveProject;
    var error = function(m, e) { new views.Modal(e); };
    $('input[type=submit]').addClass('disabled');
    $('#meta-map').addClass('loading');

    // Massage values.
    if (attr.filename) attr.filename = attr.filename + '.' + this.model.get('format');
    if (attr.bounds) attr.bounds = _(attr.bounds.split(',')).map(parseFloat);
    if (attr.center) attr.center = _(attr.center.split(',')).map(parseFloat);
    if (attr.zooms) attr.minzoom = attr.zooms[0];
    if (attr.zooms) attr.maxzoom = attr.zooms[1];
    if (attr.format || attr.format_custom) attr.format = attr.format || attr.format_custom;
    if (attr.height) attr.height = parseInt(attr.height,10);
    if (attr.width) attr.width = parseInt(attr.width,10);
    if (attr.static_zoom) attr.static_zoom = parseInt(attr.static_zoom,10);
    delete attr.zooms;
    delete attr.format_custom;
    delete attr._saveProject;
    attr = _(attr).reduce(function(memo, val, key) {
        var allowEmpty = ['description', 'attribution', 'note'];
        if (val !== '' || _(allowEmpty).include(key)) memo[key] = val;
        return memo;
    }, {});

    // If only editing the Project settings, just save the Settings and exit
    if (this.model === this.project) {
        if (!this.project.set(attr, {error:error})) return false;
        this.project.save({}, { success:this.success, error:error});
        return false;
    }

    // Write export settings to Exports model
    switch (this.model.get('format')) {
    case 'mbtiles':
        if (!this.model.set({
            filename: attr.filename,
            note: attr.note,
            bbox: attr.bounds,
            minzoom: attr.minzoom,
            maxzoom: attr.maxzoom,
            center: attr.center
        }, {error:error})) return false;
        break;
    default:
        if (!this.model.set({
            filename: attr.filename,
            note: attr.note,
            bbox: attr.bounds,
            width: attr.width,
            height: attr.height,
            static_zoom: attr.static_zoom
        }, {error:error})) return false;
        break;
    }

    // Just save the export.
    if (!save) return this.model.save({}, this) && false;

    // Save export and then project.
    delete attr.filename;
    delete attr.width;
    delete attr.height;
    delete attr.static_zoom;
    if (!this.project.set(attr, {error: function(m, e) {
        if (e.message === "Bounds W must be less than E.") {
            e.message = "Cannot save to project if export crosses the Anti-Meridian";
        }
        error(m, e);
    }})) return false;
    Bones.utils.serial([
    _(function(next) {
        this.model.save({}, { success:next, error:this.error });
    }).bind(this),
    _(function(next) {
        this.project.save({}, this);
    }).bind(this)]);
    return false;
};

view.prototype.selectLayer = function() {
    var val = this.$('select.maplayer-selection').val();
    var layer = this.map.getLayerAt(0);

    if (val === "project") {
        layer.provider.options = this.model.attributes;
        layer.provider.options.tiles = this.project.attributes.tiles;
    }
    else {
        //don't mess with the original ref from the project, simple clone
        var clone = JSON.parse(JSON.stringify(this.map.getLayerAt(0).provider.options));
        clone.tiles[0] = val.toLowerCase();
        layer.provider.options = clone;
    }
    layer.setProvider(layer.provider);
    this.map.draw();

    this.boxselector.add(this.map);
}

