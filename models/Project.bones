// Project
// -------
// Model. A single TileMill map project. Describes an MML JSON map object that
// can be used by `carto` to render a map.
model = Backbone.Model.extend({
    schema: {
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
                'enum': ['png', 'png24', 'png8', 'jpeg80', 'jpeg85', 'jpeg90', 'jpeg95']
            },
            'interactivity': {
                'type': ['object', 'boolean']
            },

            // TileJSON properties.
            'name':        { 'type': 'string' },
            'description': { 'type': 'string' },
            'version':     { 'type': 'string' },
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
                'items': { 'type': 'number' }
            },
            'center': {
                'type': 'array',
                'items': { 'type': 'number' }
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
                'title': 'Name',
                'description': 'Name may include alphanumeric characters, dashes and underscores.',
                'ignore': true
            }
        }
    },
    STYLESHEET_DEFAULT: [{
        id: 'style.mss',
        data: 'Map {\n'
            + '  background-color: #fff;\n'
            + '}\n\n'
            + '#world {\n'
            + '  polygon-fill: #eee;\n'
            + '  line-color: #ccc;\n'
            + '  line-width: 0.5;\n'
            + '}'
    }],
    LAYER_DEFAULT: [{
        id: 'world',
        name: 'world',
        srs: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 '
        + '+lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over',
        geometry: 'polygon',
        Datasource: {
            file: 'http://tilemill-data.s3.amazonaws.com/world_borders_merc.zip',
            type: 'shape'
        }
    }],
    defaults: {
        'bounds': [-180,-90,180,90],
        'center': [0,0,2],
        'format': 'png',
        'interactivity': false,
        'minzoom': 0,
        'maxzoom': 22,
        'srs': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 '
            + '+lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over',
        'Stylesheet': [],
        'Layer': []
    },
    // Set model options to `this.options`.
    initialize: function(attributes, options) {
        this.options = options;
    },
    // Custom setDefaults() method for creating a project with default layers,
    // stylesheets, etc. Note that we do not use Backbone native initialize()
    // or defaults(), both of which make default values far pervasive than the
    // expected use here.
    setDefaults: function() {
        var template = {};
        !this.get('Stylesheet').length && (template.Stylesheet = this.STYLESHEET_DEFAULT);
        !this.get('Layer').length && (template.Layer = this.LAYER_DEFAULT);
        this.set(this.parse(template), { silent: true });
    },
    // Instantiate collections from arrays.
    parse: function(resp) {
        resp.Stylesheet && (resp.Stylesheet = new models.Stylesheets(
            resp.Stylesheet,
            {parent: this}
        ));
        resp.Layer && (resp.Layer = new models.Layers(
            resp.Layer,
            {parent: this}
        ));
        return resp;
    },
    url: function() {
        return '/api/Project/' + this.id;
    },
    // Adds:
    // - id uniqueness checking.
    // - interactivity check to ensure the referenced layer exists.
    validate: function(attr) {
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

        return this.validateAttributes(attr);
    },
    // Custom validation method that allows for asynchronous processing.
    // Expects options.success and options.error callbacks to be consistent
    // with other Backbone methods.
    validateAsync: function(attributes, options) {
        // If client-side, pass-through.
        if (!Bones.server) return options.success(this, null);

        // Catches three main types of errors:
        // - localize failure
        // - carto compilation failure
        // - limited mapnik "test render" failure
        var mapnik = require('mapnik');
        var path = require('path');
        var mml = _(attributes).extend({_updated: + new Date()});
        this.localize(mml, function(err) {
            if (err) return options.error(this, err);

            var map = new mapnik.Map(1,1);
            var im = new mapnik.Image(1,1);
            map.fromString(this.xml, {
                strict:false,
                base:path.join(Bones.plugin.config.files, 'project', this.id)
            }, function(err, map) {
                if (err) return options.error(this.err);
                map.bufferSize = 0;
                map.extent = [0,0,1,1];
                map.render(im, {format:'png'}, function(err) {
                    if (err) return options.error(this, err);
                    options.success(this, null);
                }.bind(this));
            });
        }.bind(this));
    },
    // Single tile thumbnail URL generation. From [OSM wiki][1].
    // [1]: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
    thumb: function() {
        var z = this.get('center')[2];
        var lat_rad = this.get('center')[1] * Math.PI / 180 * -1; // -1 for TMS (flipped from OSM)
        var x = parseInt((this.get('center')[0] + 180.0) / 360.0 * Math.pow(2, z));
        var y = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * Math.pow(2, z));
        return this.get('tiles')[0]
            .replace('{z}', z)
            .replace('{x}', x)
            .replace('{y}', y);
('_updated');
    },
    // Wrap `save` to call validateAsync first.
    save: _(Backbone.Model.prototype.save).wrap(function(parent, attrs, options) {
        this.validateAsync(attrs, {
            success: _(function() {
                parent.call(this, attrs, options);
            }).bind(this),
            error: options.error
        });
    }),
    // Hit the project poll endpoint.
    poll: function(options) {
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
    },
    // Hit the project flush endpoint.
    flush: function(layer, options) {
        if (Bones.server) throw Error('Client-side method only.');
        if (!this.get('Layer').get(layer)) throw Error('No layer ' + layer + ' found.');

        $.ajax({
            url: this.url() + '/' + layer,
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
    }
})

