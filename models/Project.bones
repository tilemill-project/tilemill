// Project
// -------
// Model. A single TileMill map project. Describes an MML JSON map object that
// can be used by `carto` to render a map.
model = Backbone.Model.extend({});

model.prototype.schema = {
    'type': 'object',
    'properties': {
        // Mapnik-specific properties.
        'srs': {
            'type': 'string',
            'required': true
        },
        'Stylesheet': {
            'type': ['object', 'array'],
            'required': true
        },
        'Layer': {
            'type': ['object', 'array'],
            'required': true
        },

        // TileMill-specific properties. @TODO these need a home, see
        // https://github.com/mapbox/tilelive-mapnik/issues/4
        'format': {
            'type': 'string',
            'enum': ['png', 'png24', 'png8', 'jpeg80', 'jpeg85',
                'jpeg90', 'jpeg95']
        },
        'interactivity': {
            'type': ['object', 'boolean']
        },

        // TileJSON properties.
        'name':        { 'type': 'string' },
        'description': { 'type': 'string' },
        'version':     {
            'type': 'string',
            'description': 'Semver compatible version string.',
            'pattern': '\\d+\\.\\d+\\.\\d+\\w?[\\w\\d]*'
        },
        'attribution': { 'type': 'string' },
        'legend':      { 'type': 'string' },
        'minzoom': {
            'minimum': 0,
            'maximum': 22,
            'type': 'integer'
        },
        'maxzoom': {
            'minimum': 0,
            'maximum': 22,
            'type': 'integer'
        },
        'bounds': {
            'type': 'array',
            'minItems': 4,
            'maxItems': 4,
            'items': [
                { 'type':'number', 'minimum': -180, 'maximum':180 },
                {
                    'type':'number',
                    'minimum': -85.05112877980659,
                    'maximum': 85.05112877980659 },
                { 'type':'number', 'minimum': -180, 'maximum':180 },
                {
                    'type':'number',
                    'minimum': -85.05112877980659,
                    'maximum': 85.05112877980659 }
            ]
        },
        'center': {
            'type': 'array',
            'minItems': 3,
            'maxItems': 3,
            'items': [
                { 'type':'number', 'minimum':-180, 'maximum':180 },
                {
                    'type':'number',
                    'minimum':-85.05112877980659,
                    'maximum':85.05112877980659 },
                { 'type':'integer', 'minimum':0, 'maximum':22 }
            ]
        },

        // Non-stored properties.
        // @TODO make this writable at some point
        'scheme': {
            'type': 'string',
            'ignore': true
        },
        // @TODO make this writable at some point
        'formatter': {
            'type': 'string',
            'ignore': true
        },
        'tilejson': {
            'type': 'string',
            'ignore': true
        },
        'tiles': {
            'type': 'array',
            'required': true,
            'items': { 'type': 'string' },
            'ignore': true
        },
        'grids': {
            'type': 'array',
            'items': { 'type': 'string' },
            'ignore': true
        },
        '_updated': {
            'type': 'integer',
            'description': 'Last update time of project',
            'ignore': true
        },
        'id': {
            'type': 'string',
            'required': true,
            'pattern': '^[A-Za-z0-9\-_]+$',
            'title': 'Filename',
            'description': 'Filename may include alphanumeric characters, dashes and underscores.',
            'ignore': true
        }
    }
};

model.prototype.STYLESHEET_DEFAULT = [{
    id: 'style.mss',
    data: 'Map {\n'
        + '  background-color: #b8dee6;\n'
        + '}\n\n'
        + '#countries {\n'
        + '  ::outline {\n'
        + '    line-color: #85c5d3;\n'
        + '    line-width: 2;\n'
        + '    line-join: round;\n'
        + '  }\n'
        + '  polygon-fill: #fff;\n'
        + '}'
}];

model.prototype.STYLESHEET_DEFAULT_NODATA = [{
    id: 'style.mss',
    data: 'Map {\n'
        + '  background-color: #b8dee6;\n'
        + '}\n\n'
}];

model.prototype.LAYER_DEFAULT = [{
    id: 'countries',
    name: 'countries',
    srs: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 '
        + '+lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over',
    geometry: 'polygon',
    Datasource: {
        file: 'http://mapbox-geodata.s3.amazonaws.com/natural-earth-1.3.0/cultural/10m-admin-0-countries.zip',
        type: 'shape'
    }
}];

model.prototype.defaults = {
    'bounds': [-180,-85.05112877980659,180,85.05112877980659],
    'center': [0,0,2],
    'format': 'png',
    'interactivity': false,
    'minzoom': 0,
    'maxzoom': 22,
    'srs': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 '
        + '+lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over',
    'Stylesheet': [],
    'Layer': []
};

// Set model options to `this.options`.
model.prototype.initialize = function(attributes, options) {
    this.options = options;
};

// Custom setDefaults() method for creating a project with default layers,
// stylesheets, etc. Note that we do not use Backbone native initialize()
// or defaults(), both of which make default values far pervasive than the
// expected use here.
model.prototype.setDefaults = function(data) {
    var template = {};
    if (data) {
        !this.get('Stylesheet').length && (template.Stylesheet = this.STYLESHEET_DEFAULT);
        !this.get('Layer').length && (template.Layer = this.LAYER_DEFAULT);
    }
    else {
        !this.get('Stylesheet').length && (template.Stylesheet = this.STYLESHEET_DEFAULT_NODATA);
    }
    this.set(this.parse(template), { silent: true });
};

// Instantiate collections from arrays.
model.prototype.parse = function(resp) {
    resp.Stylesheet && (resp.Stylesheet = new models.Stylesheets(
        resp.Stylesheet,
        {parent: this}
    ));
    resp.Layer && (resp.Layer = new models.Layers(
        resp.Layer,
        {parent: this}
    ));
    return resp;
};

model.prototype.url = function() {
    return '/api/Project/' + this.id;
};

// Adds:
// - id uniqueness checking.
// - interactivity check to ensure the referenced layer exists.
model.prototype.validate = function(attr) {
    var error = this.validateAttributes(attr);
    if (error) return error;

    if (attr.id &&
        this.collection &&
        this.collection.get(attr.id) &&
        this.collection.get(attr.id) !== this)
            return new Error(_('Project "<%=id%>" already exists.').template(attr));

    if (attr.interactivity && attr.interactivity.layer && attr.Layer) {
        var id = attr.interactivity.layer;
        var layers = _(attr.Layer).isArray()
            ? attr.Layer
            : attr.Layer.toJSON();
        if (!_(layers).chain().pluck('id').include(id).value())
            return new Error(_('Interactivity layer "<%=obj%>" does not exist.').template(id));
    }

    if (attr.bounds && attr.bounds[0] >= attr.bounds[2])
        return new Error('Bounds W must be less than E.');
    if (attr.bounds && attr.bounds[1] >= attr.bounds[3])
        return new Error('Bounds S must be less than N.');

    if (attr.center && attr.bounds &&
       (attr.center[0] < attr.bounds[0] ||
        attr.center[0] > attr.bounds[2] ||
        attr.center[1] < attr.bounds[1] ||
        attr.center[1] > attr.bounds[3]))
        return new Error('Center must be within bounds.');
    if (attr.center && attr.minzoom && (attr.center[2] < attr.minzoom))
        return new Error('Center must be within zoom range.');
    if (attr.center && attr.maxzoom && (attr.center[2] > attr.maxzoom))
        return new Error('Center must be within zoom range.');
};

// Single tile thumbnail URL generation. From [OSM wiki][1].
// [1]: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
model.prototype.thumb = function() {
    var z = this.get('center')[2];
    var lat_rad = this.get('center')[1] * Math.PI / 180 * -1; // -1 for TMS (flipped from OSM)
    var x = parseInt((this.get('center')[0] + 180.0) / 360.0 * Math.pow(2, z));
    var y = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * Math.pow(2, z));
    return this.get('tiles')[0]
        .replace('{z}', z)
        .replace('{x}', x)
        .replace('{y}', y) + '&cache=true';
};

// Hit the project poll endpoint.
model.prototype.poll = function(options) {
    if (Bones.server) throw Error('Client-side method only.');
    $.ajax({
        url: this.url() + '/' + this.get('_updated'),
        type: 'GET',
        contentType: 'application/json',
        processData: false,
        success: _(function(resp) {
            if (!_(resp).keys().length) return;
            if (!this.set(this.parse(resp))) return;
            this.trigger('poll', this, resp);
            if (options.success) options.success(this, resp);
        }).bind(this),
        error: _(function(resp) {
            if (options.error) options.error(this, resp);
        }).bind(this)
    });
};

// Hit the project flush endpoint.
model.prototype.flush = function(layer, url, options) {
    if (Bones.server) throw Error('Client-side method only.');
    if (!this.get('Layer').get(layer)) throw Error('No layer ' + layer + ' found.');

    $.ajax({
        url: this.url() + '/' + layer + '?' + $.param({url: url}),
        type: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({'bones.token':Backbone.csrf(this.url())}),
        dataType: 'json',
        processData: false,
        success: _(function(resp) {
            this.trigger('change');
            if (options.success) options.success(this, resp);
        }).bind(this),
        error: _(function(resp) {
            if (options.error) options.error(this, resp);
        }).bind(this)
    });
};

