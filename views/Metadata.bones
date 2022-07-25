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
    'change select.exportformat-selection' : 'exportFormat',
    'change select.papersize-selection,\
        select.orientation-selection' : 'updateAspect',
    'change input[name=fullaspectwidth],\
        input[name=fullaspectheight],\
        input[name=margin_top],\
        input[name=margin_btm],\
        input[name=margin_left],\
        input[name=margin_right], ': 'updateBox'
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
        'updateAspect',
        'updateBox',
        'exportFormat');
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
            this.updateAspect();
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

view.prototype.updateSlider = function() {
    if (this.type === 'tiles') this.updateTotal();
    else this.updatePreview();
};

// Fix the bbox size based upon entered aspect ratio.
view.prototype.updateAspect = function(ev) {
    // Get value from paper size dropdown
    var papersize = this.$('select.papersize-selection').val().toLowerCase();
    var orientation = this.$('select.orientation-selection').val().toLowerCase();

    // Default settings to common values.
    this.$('input[name=bounds]').attr('disabled', true);                // Bounds disabled
    this.$('select.orientation-selection').attr('hidden',true)          // Orientation hidden
    this.$('div[id=custom-aspect-ratio]')[0].setAttribute('hidden',true); // Custom fields hidden
    this.$('input[name=fullaspectwidth]').attr('disabled', true);       // AspectWidth disabled
    this.$('input[name=fullaspectheight]').attr('disabled', true);      // AspectHeight disabled
    this.$('input[name=setaspect]').attr('checked', true);              // SetAspect checked/locked
    this.$('div[id=margins]')[0].removeAttribute('hidden');             // Margin fields displayed
    this.$('input[name=printedwidth]').attr('disabled', true);          // PrintedWidth disabled

    switch (papersize) {
    case 'freeform': //disable fields and remove size restriction
        this.$('input[name=bounds]').attr('disabled', false);           // Bounds enabled
        this.$('input[name=setaspect]').attr('checked', false);         // SetAspect unchecked/unlocked
        this.$('div[id=margins]')[0].setAttribute('hidden',true);       // Margin fields hidden
        this.$('input[name=printedwidth]').attr('disabled', false);     // PrintedWidth enabled
        return false;
        break;    
    case 'custom':   //allow user to draw custom bounding box
        //enable aspect ratio fields (if not already defaulted to enabled)
        this.$('div[id=custom-aspect-ratio]')[0].removeAttribute('hidden'); // Custom fields displayed
        this.$('input[name=fullaspectwidth]').attr('disabled', false);  // AspectWidth enabled
        this.$('input[name=fullaspectheight]').attr('disabled', false); // AspectHeight enabled
        break;
    default:         //use standard paper size for aspect ratio
        this.$('select.orientation-selection').attr('hidden',false);    // Orientation displayed
        // Set aspect values from selected paper size
        var dimensions = papersize.split('x').map(parseFloat);
        this.$('div[id=custom-aspect-ratio]')[0].removeAttribute('hidden'); // Custom fields displayed
        var fullaspectwidth  = orientation == "portrait" ? dimensions[0] : dimensions[1];
        var fullaspectheight = orientation == "portrait" ? dimensions[1] : dimensions[0];
        // Update displayed values for the aspect.
        this.$('input[name=fullaspectwidth]').val((fullaspectwidth).toFixed(2));
        this.$('input[name=fullaspectheight]').val((fullaspectheight).toFixed(2));
        break;
    };

    this.updateBox(ev);
};

// Update fields to change the screen.
view.prototype.updateBox = function(ev) {

    // Get width and height and if they are not numbers, then reset them to their previous values.
    var fullaspectwidth = parseFloat(this.$('input[name=fullaspectwidth]').val());
    if (!_(fullaspectwidth).isNumber() || fullaspectwidth <= 0) {
        fullaspectwidth = parseFloat(this.$('input[name=fullaspectwidth-prev]').val());
        this.$('input[name=fullaspectwidth]').val((fullaspectwidth).toFixed(2));
    }
    var fullaspectheight = parseFloat(this.$('input[name=fullaspectheight]').val());
    if (!_(fullaspectheight).isNumber() || fullaspectheight <= 0) {
        fullaspectheight = parseFloat(this.$('input[name=fullaspectheight-prev]').val());
        this.$('input[name=fullaspectheight]').val((fullaspectheight).toFixed(2));
    }
    // Save the fullaspect values to the previous attributes for use the next time.
    this.$('input[name=fullaspectwidth-prev]').val((fullaspectwidth).toFixed(2));
    this.$('input[name=fullaspectheight-prev]').val((fullaspectheight).toFixed(2));

    // Get margins and if they are not numbers (or otherwise have bogus values), then reset them.
    var margintop = parseFloat(this.$('input[name=margin_top]').val());
    if (!_(margintop).isNumber() || margintop < 0 || (fullaspectheight - margintop) <= 0) {
        if ((fullaspectheight - margintop) <= 0) { // The margin is bigger than the aspect.
            margintop = 0;
        } else {
            margintop = parseFloat(this.$('input[name=margin_top-prev]').val());
        }
        this.$('input[name=margin_top]').val((margintop).toFixed(2));
    }
    var marginbottom = parseFloat(this.$('input[name=margin_btm]').val());
    if (!_(marginbottom).isNumber() || marginbottom < 0 || (fullaspectheight - margintop - marginbottom) <= 0) {
        if ((fullaspectheight - margintop - marginbottom) <= 0) { // The margins are bigger than the aspect.
            marginbottom = 0;
        } else {
            marginbottom = parseFloat(this.$('input[name=margin_btm-prev]').val());
        }
        this.$('input[name=margin_btm]').val((marginbottom).toFixed(2));
    }
    var marginleft = parseFloat(this.$('input[name=margin_left]').val());
    if (!_(marginleft).isNumber() || marginleft < 0 || (fullaspectwidth - marginleft) <= 0) {
        if ((fullaspectwidth - marginleft) <= 0) { // The margin is bigger than the aspect.
            marginleft = 0;
        } else {
            marginleft = parseFloat(this.$('input[name=margin_left-prev]').val());
        }
        this.$('input[name=margin_left]').val((marginleft).toFixed(2));
    }
    var marginright = parseFloat(this.$('input[name=margin_right]').val());
    if (!_(marginright).isNumber() || marginright < 0 || (fullaspectwidth - marginleft - marginright) <= 0) {
        if ((fullaspectwidth - marginleft - marginright) <= 0) { // The margins are bigger than the aspect.
            marginright = 0;
        } else {
            marginright = parseFloat(this.$('input[name=margin_right-prev]').val());
        }
        this.$('input[name=margin_right]').val((marginright).toFixed(2));
    }
    // Save the margin values to the previous attributes for use the next time.
    this.$('input[name=margin_top-prev]').val((margintop).toFixed(2));
    this.$('input[name=margin_btm-prev]').val((marginbottom).toFixed(2));
    this.$('input[name=margin_left-prev]').val((marginleft).toFixed(2));
    this.$('input[name=margin_right-prev]').val((marginright).toFixed(2));

    // Save the original value of aspectwidth.
    var aspectwidthprev  = parseFloat(this.$('input[name=aspectwidth]').val());
    // Update stored values after adjusting for margins.
    var aspectwidth  = fullaspectwidth  - (marginleft + marginright);
    var aspectheight = fullaspectheight - (margintop  + marginbottom);
    this.$('input[name=aspectwidth]').val((aspectwidth).toFixed(2));
    this.$('input[name=aspectheight]').val((aspectheight).toFixed(2));
    // Calculate the new aspect and the width ratio.
    var aspectwidthchange = parseFloat(aspectwidth / aspectwidthprev);
    var aspect = parseFloat(aspectheight / aspectwidth);

    // Get current drawn extent coordinates
    var bounds = _(this.$('input[name=bounds]').val().split(',')).map(parseFloat);
    var nwLoc = new MM.Location(bounds[3], bounds[0]);
    var seLoc = new MM.Location(bounds[1], bounds[2]);
    var nw = this.map.locationPoint(nwLoc);
    var se = this.map.locationPoint(seLoc);

    // Update the box to match the new aspect.
    var oldWidth = parseFloat(se.x) - parseFloat(nw.x);
    var newWidth = oldWidth * aspectwidthchange;
    se.x = (nw.x + newWidth).toFixed(4);
    se.y = (nw.y + (newWidth * aspect)).toFixed(4);
    var seLoc = this.map.pointLocation(se);
    // Remove extra decimals that get added
    seLoc.lat = (seLoc.lat).toFixed(4);

    // Update printed width value based upon aspect ratio x value
    this.$('input[name=printedwidth]').val(aspectwidth);

    // Update bounding box field, redraw bounding extent
    this.$('input[name=bounds]').val([nwLoc.lon,seLoc.lat,seLoc.lon,nwLoc.lat].join(','));
    this.boxselector.extent([nwLoc, seLoc], true);
    this.updateSize();
};

// Update size fields based on bbox ratio.
view.prototype.updateSize = function(ev) {

    // Get bounds and if it is not made up of at least 4 numbers, then reset it to it's previous values.
    var boundsstring = this.$('input[name=bounds]').val();
    var bounds = _(boundsstring.split(',')).map(parseFloat);
    if (!_(bounds[0]).isNumber() || !_(bounds[1]).isNumber() || !_(bounds[2]).isNumber() || !_(bounds[3]).isNumber()) {
        boundsstring = this.$('input[name=bounds-prev]').val();
        bounds = _(boundsstring.split(',')).map(parseFloat);
        this.$('input[name=bounds]').val(boundsstring);
    }
    // Save the new bounds value to the prev field for use later.
    this.$('input[name=bounds-prev]').val(boundsstring);

    // Get printedwidth and if it is invalid, then reset it to it's previous value.
    var printedwidth = parseFloat(this.$('input[name=printedwidth]').val());
    if (!_(printedwidth).isNumber() || printedwidth <= 0) {
        printedwidth = parseFloat(this.$('input[name=printedwidth-prev]').val());
        this.$('input[name=printedwidth]').val(printedwidth);
    }
    // Save the new printedwidth value to the prev field for use later.
    this.$('input[name=printedwidth-prev]').val(printedwidth);

    // Get featurepixels and if it is invalid, then reset it to it's previous value.
    var featurepixels = parseFloat(this.$('input[name=featurepixels]').val());
    if (!_(featurepixels).isNumber() || featurepixels <= 0 || !Number.isInteger(featurepixels)) {
        featurepixels = parseFloat(this.$('input[name=featurepixels-prev]').val());
        this.$('input[name=featurepixels]').val(featurepixels);
    }
    // Save the new featurepixels value to the prev field for use later.
    this.$('input[name=featurepixels-prev]').val(featurepixels);

    var target = $((ev || {}).currentTarget);
    var attr   = Bones.utils.form(this.$('form'), this.model);
    var nwLoc  = new MM.Location(bounds[3], bounds[0]);
    var seLoc  = new MM.Location(bounds[1], bounds[2]);
    var neLoc  = new MM.Location(bounds[3], bounds[2]);
    var nw     = this.map.locationPoint(nwLoc);
    var se     = this.map.locationPoint(seLoc);
    var aspect = (se.x - nw.x) / (se.y - nw.y);
    var sizewidth  = parseInt(this.$('input[name=width]').val(), 10);
    var sizeheight = parseInt(this.$('input[name=height]').val(), 10);

    // Switch based upon which field was changed
    switch (target.attr('name')) {
    case 'bounds':
        this.$('input[name=setaspect]').attr('checked', false);
        this.boxselector.extent([nwLoc, seLoc], true);
        break;
    case 'height':
        if (_(sizeheight).isNumber() && _(aspect).isNumber()) {
            sizewidth = Math.round(sizeheight * aspect);
            this.$('input[name=width]').val(sizewidth);
            }
        break;
    case 'width':
        // Handled below.
        break;
    default:
    };

    // Update Size Height field, keep width constant
    // TODO: Change to keep Height, change width instead
    if (_(sizewidth).isNumber() && _(aspect).isNumber()) {
        sizeheight = Math.round(sizewidth / aspect);
        this.$('input[name=height]').val(sizeheight);
    }

    // Update aspect ratio fields only if the aspect ratio is not locked.
    if (!attr.setaspect) {
        // Keep the aspectheight matching the change in size based on the aspect ratio.
        var aspectwidth  = parseFloat(this.$('input[name=aspectwidth]').val());
        var aspectheight = parseFloat(this.$('input[name=aspectheight]').val());
        aspectheight = aspectwidth / aspect;
        this.$('input[name=aspectheight]').val(aspectheight.toFixed(2));
        // Update the fullaspectheight by adding the margins to aspectheight.
        var margintop    = parseFloat(this.$('input[name=margin_top]').val());
        var marginbottom = parseFloat(this.$('input[name=margin_btm]').val());
        var fullaspectheight = aspectheight + (margintop + marginbottom);
        this.$('input[name=fullaspectheight]').val(fullaspectheight.toFixed(2));
    }

    // Update scale & distances fields
    var pixelSize = .00035;
    var dpi = 72;
    var distances = this.boxselector.distances(nwLoc, seLoc);
    var scale = distances.x / ( parseFloat(this.$('input[name=printedwidth]').val()) * pixelSize * dpi);
    this.$('input[name=scale]').val(scale.toFixed(0));
    this.$('input[name=boxWidth]').val(distances.x.toFixed(2));
    this.$('input[name=boxHeight]').val(distances.y.toFixed(2));

    // Update feature size fields
    this.$('input[name=featureprinted]').val((featurepixels * printedwidth / sizewidth).toFixed(3));

    // Update total tiles.
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
    default: // printed export
        if (!this.model.set({
            filename: attr.filename,
            note: attr.note,
            bbox: attr.bounds,
            width: attr.width,
            height: attr.height,
            static_zoom: attr.static_zoom,
            papersize: attr.papersize,
            orientation: attr.orientation,
            margin_top: attr.margin_top,
            margin_btm: attr.margin_btm,
            margin_left: attr.margin_left,
            margin_right: attr.margin_right,
            aspectwidth: attr.aspectwidth,
            aspectheight: attr.aspectheight,
            printedwidth: attr.printedwidth
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

view.prototype.exportFormat = function() {
    var extension = this.$('select.exportformat-selection').val().toLowerCase();
    this.model.set({format: extension}, {silent:true});
    this.$('input[name=filenameExtension]').val(extension);
}