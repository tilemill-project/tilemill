// Project
// -------
// Model. A single TileMill map project. Describes an MML JSON map object that
// can be used by `carto` to render a map.
model = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true,
                'pattern': '^[A-Za-z0-9\-_]+$',
                'title': 'Name',
                'description': 'Name may include alphanumeric characters, dashes and underscores.'
            },
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
            '_format': {
                'type': 'string',
                'enum': ['png', 'png24', 'png8', 'jpeg80', 'jpeg85', 'jpeg90', 'jpeg95']
            },
            '_center': {
                'type': 'object'
            },
            '_interactivity': {
                'type': ['object', 'boolean']
            },
            '_updated': {
                'type': 'integer'
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
        '_center': { lat:0, lon:0, zoom:2 },
        '_format': 'png',
        '_interactivity': false,
        'srs': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 '
            + '+lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over',
        'Stylesheet': [],
        'Layer': []
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
        return 'api/Project/' + this.id;
    },
    // Adds id uniqueness checking to validate.
    validate: function(attr) {
        if (attr.id &&
            this.collection &&
            this.collection.get(attr.id) &&
            this.collection.get(attr.id) !== this)
                return new Error(_('Project "<%=id%>" already exists.').template(attr));
        return this.validateAttributes(attr);
    },
    // Custom validation method that allows for asynchronous processing.
    // Expects options.success and options.error callbacks to be consistent
    // with other Backbone methods.
    validateAsync: function(attributes, options) {
        // If client-side, pass-through.
        if (typeof require === 'undefined') {
            return options.success(this, null);
        }

        var carto = require('tilelive-mapnik/node_modules/carto'),
            mapnik = require('tilelive-mapnik/node_modules/mapnik'),
            that = this,
            stylesheets = this.get('Stylesheet'),
            env = {
                returnErrors: true,
                errors: [],
                validation_data: {
                    fonts: mapnik.fonts()
                },
                deferred_externals: [],
                only_validate: true,
                effects: []
            };

        // Hard clone the model JSON before rendering as rendering will change
        // properties (e.g. localize a datasource URL to the filesystem).
        var data = JSON.parse(JSON.stringify(attributes));
        new carto.Renderer(env)
            .render(data, function(err, output) {
            if (err) {
                options.error(that, err);
            } else {
                options.success(that, null);
            }
        });
    },
    // Interactivity: Convert teaser/full template markup into formatter js.
    // Replaces tokens like `[NAME]` with string concatentations of `data.NAME`
    // removes line breaks and escapes single quotes.
    // @TODO properly handle other possible #fail. Maybe use underscore
    // templating?
    formatterJS: function() {
        if (_.isEmpty(this.get('_interactivity'))) return;

        var full = this.get('_interactivity').template_full || '';
        var teaser = this.get('_interactivity').template_teaser || '';
        var location = this.get('_interactivity').template_location || '';
        full = full.replace(/\'/g, '\\\'').replace(/\[([\w\d]+)\]/g, "' + data.$1 + '").replace(/\n/g, ' ');
        teaser = teaser.replace(/\'/g, '\\\'').replace(/\[([\w\d]+)\]/g, "' + data.$1 + '").replace(/\n/g, ' ');
        location = location.replace(/\'/g, '\\\'').replace(/\[([\w\d]+)\]/g, "' + data.$1 + '").replace(/\n/g, ' ');
        return "function(options, data) { "
            + "  switch (options.format) {"
            + "    case 'full': "
            + "      return '" + full + "'; "
            + "      break; "
            + "    case 'location': "
            + "      return '" + location + "'; "
            + "      break; "
            + "    case 'teaser': "
            + "    default: "
            + "      return '" + teaser + "'; "
            + "      break; "
            + "  }"
            + "}";
    },
    // Interactivity: Retrieve array of field names to be included in
    // interactive tiles by parsing `[field]` tokens.
    formatterFields: function() {
        if (_.isEmpty(this.get('_interactivity'))) return;
        var fields = [];
        var full = this.get('_interactivity').template_full || '';
        var teaser = this.get('_interactivity').template_teaser || '';
        fields = fields
            .concat(full.match(/\[([\w\d]+)\]/g))
            .concat(teaser.match(/\[([\w\d]+)\]/g));
        fields = _(fields).chain()
            .filter(_.isString)
            .map(function(field) { return field.replace(/[\[|\]]/g, ''); })
            .uniq()
            .value();
        return fields;
    },
    // Single tile thumbnail URL generation. From [OSM wiki][1].
    // [1]: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
    thumb: function() {
        var lat = this.get('_center').lat * -1; // TMS
        var lon = this.get('_center').lon;
        var z = this.get('_center').zoom;
        var lat_rad = lat * Math.PI / 180;
        var x = parseInt((lon + 180.0) / 360.0 * Math.pow(2, z));
        var y = parseInt(
            (1.0 -
                Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) /
                Math.PI) /
                2.0 * Math.pow(2, z));
        return '/' + ['1.0.0', this.id, z, x, y].join('/') + '.png?updated=' + this.get('_updated');
    }
});

