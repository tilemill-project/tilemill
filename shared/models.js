// Backbone models and collections for use on both the client and server.
// @TODO if we use the keyword 'var' in front of Backbone, _, IE will wipe the
// globally defined Backbone and underscore leaving us with broken objects.
// This is obviously not ideal.
if (typeof require !== 'undefined' && typeof window === 'undefined') {
    _ = require('underscore')._;
    Backbone = require('backbone');
    JSV = require('JSV').JSV;
}

// JSON schema validation
// ----------------------
// Provide a default `validate()` method for all models. If a `schema` property
// is defined on a model, use JSON-schema validation by default.
Backbone.Model.prototype.validate = function(attributes) {
    if (!this.schema || !this.schema.properties) return;
    var env = JSV.createEnvironment();
    for (var key in attributes) {
        if (this.schema.properties[key]) {
            var property = this.schema.properties[key],
                value = attributes[key];
            // Do a custom check for required properties, (e.g. do not allow
            // an empty string to validate against a required property.)
            if (!value && property.required) {
                return (property.title || key) + ' is required.';
            }

            var errors = env.validate(value, property).errors;
            if (errors.length) {
                var error = errors.pop();
                if (property.description) {
                    return property.description;
                } else {
                    return (property.title || key) + ': ' + error.message;
                }
            }
        }
    }
};

// Abilities (read-only)
// ---------------------
// Model. Describes server API abilities.
var Abilities = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'fonts': {
                'type': 'array',
                'title': 'Fonts',
                'description': 'Fonts available to Mapnik.'
            },
            'datasources': {
                'type': 'array',
                'title': 'Datasources',
                'description': 'Datasource types available to Mapnik.'
            },
            'exports': {
                'type': 'object',
                'title': 'Exports',
                'description': 'Export types available to Mapnik.'
            }
        }
    },
    url: 'api/Abilities'
});

// Reference (read-only)
// ---------------------
// Model. MSS syntax reference.
var Reference = Backbone.Model.extend({
    url: 'api/Reference'
});

// Datasource (read-only)
// ----------------------
// Model. Inspection metadata about a map layer. Use `fetchFeatures()` to do
// a datasource fetch that includes layer feature objects.
var Datasource = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
            },
            'url': {
                'type': 'string',
                'required': true,
                'minLength': 1,
                'title': 'URL',
                'description': 'URL of the datasource.'
            },
            'fields': {
                'type': 'object'
            },
            'features': {
                'type': 'array'
            },
            'ds_options': {
                'type': 'object'
            },
            'ds_type': {
                'type': 'string'
            },
            'geometry_type': {
                'type': 'string',
                'enum': ['polygon', 'point', 'linestring', 'raster']
            }
        }
    },
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes) {
        this.set({'fields': attributes.fields});
    },
    url: function() {
        var url = 'api/Datasource/' + Base64.encodeURI(this.get('url'));
        this.getFeatures && (url += '/features');
        return url;
    },
    fetchFeatures: function(options) {
        this.getFeatures = true;
        this.fetch(options);
    }
});

// Settings
// --------
// Model. Stores any user-specific configuration related to the app.
var Settings = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true,
                'enum': ['settings']
            },
            'mode': {
                'type': 'string',
                'enum': ['normal', 'minimal'],
                'title': 'Editing mode',
                'description': 'Editing mode may be \'normal\' or \'minimal\' to allow use of external editors.'
            }
        }
    },
    url: function() {
        return 'api/Settings/' + this.id;
    }
});

// Stylesheet
// ----------
// Model. Represents a single map MSS stylesheet. This model is a child of
// the Project model and is saved serialized as part of the parent.
// **This model is not backed directly by the server.**
var Stylesheet = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true,
                'pattern': '^[A-Za-z0-9\-_.]+$',
                'title': 'Name',
                'description': 'Name may include alphanumeric characters, dots, dashes and underscores.'
            },
            'data': {
                'type': 'string',
                'required': true
            }
        }
    },
    defaults: {
        'data': ''
    }
});

// StylesheetList
// --------------
// Collection. List of Stylesheet models. This collection is a child of the
// Project model and updates its parent on update events.
// **This collection is not backed directly by the server.**
var StylesheetList = Backbone.Collection.extend({
    model: Stylesheet,
    initialize: function(models, options) {
        var that = this;
        this.parent = options.parent;
        this.bind('change', function() {
            this.parent.set({ 'Stylesheet': that });
            this.parent.change();
        });
        this.bind('add', function() {
            this.parent.set({ 'Stylesheet': that });
            this.parent.change();
        });
        this.bind('remove', function() {
            this.parent.set({ 'Stylesheet': that });
            this.parent.change();
        });
    }
});

// Layer
// -----
// Model. Represents a single map layer. This model is a child of
// the Project model and is saved serialized as part of the parent.
// **This model is not backed directly by the server.**
var Layer = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true,
                'pattern': '^[A-Za-z0-9\-_]+$',
                'title': 'ID',
                'description': 'ID may include alphanumeric characters, dashes and underscores.'
            },
            'class': {
                'type': 'string',
                'pattern': '^[A-Za-z0-9\-_ ]*$',
                'title': 'Class',
                'description': 'Class may include alphanumeric characters, spaces, dashes and underscores.'
            },
            'srs': {
                'type': 'string'
            },
            'geometry': {
                'type': 'string',
                'enum': ['polygon', 'point', 'linestring', 'raster']
            },
            'Datasource': {
                'type': 'object',
                'required': true
            }
        }
    },
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes) {
        this.set({'Datasource': attributes.Datasource});
    },
    // Constant. Hash of simple names to known SRS strings.
    SRS: {
        // note: 900913 should be the same as EPSG 3857
        '900913': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over',
        'WGS84': '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'
    },
    // Get the name of a model's SRS string if known, otherwise reteurn
    // 'custom' or 'autodetect' if empty.
    srsName: function() {
        for (name in this.SRS) {
            if (this.SRS[name] === this.get('srs')) {
                return name;
            }
        }
        return this.get('srs') ? 'custom' : 'autodetect';
    },
    // Implementation of `Model.set()` that allows a datasource model to be
    // passed in as `options.datasource`. If provided, the datasource will be
    // used to enforce key attributes.
    set: function(attributes, options) {
        if (options && options.datasource) {
            if (options.datasource.get('ds_type') === 'gdal') {
                attributes.srs = this.SRS['900913'];
            }
            if (options.datasource.get('geometry_type')) {
                attributes.geometry = options.datasource.get('geometry_type');
            }
            if (options.datasource.get('ds_options')) {
                attributes.Datasource = _.extend(
                    attributes.Datasource,
                    options.datasource.get('ds_options')
                );
            }
        }
        return Backbone.Model.prototype.set.call(this, attributes, options);
    }
});

// LayerList
// ---------
// Collection. List of Layer models. This collection is a child of the
// Project model and updates its parent on update events.
// **This collection is not backed directly by the server.**
var LayerList = Backbone.Collection.extend({
    model: Layer,
    initialize: function(models, options) {
        var self = this;
        this.parent = options.parent;
        this.bind('change', function() {
            this.parent.set({ 'Layer': self });
            this.parent.change();
        });
        this.bind('add', function() {
            this.parent.set({ 'Layer': self });
            this.parent.change();
        });
        this.bind('remove', function() {
            this.parent.set({ 'Layer': self });
            this.parent.change();
        });
    }
});

// Project
// -------
// Model. A single TileMill map project. Describes an MML JSON map object that
// can be used by `carto` to render a map.
var Project = Backbone.Model.extend({
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
        this.set(template, { silent: true });
    },
    // Instantiate StylesheetList and LayerList collections from JSON lists
    // of plain JSON objects.
    parse: function(resp) {
        resp.Stylesheet && (resp.Stylesheet = new StylesheetList(
            resp.Stylesheet,
            {parent: this}
        ));
        resp.Layer && (resp.Layer = new LayerList(
            resp.Layer,
            {parent: this}
        ));
        return resp;
    },
    url: function() {
        return 'api/Project/' + this.id;
    },
    // Custom validation method that allows for asynchronous processing.
    // Expects options.success and options.error callbacks to be consistent
    // with other Backbone methods.
    validateAsync: function(attributes, options) {
        // If client-side, pass-through.
        if (typeof require === 'undefined') {
            return options.success(this, null);
        }

        var carto = require('carto'),
            mapnik = require('mapnik'),
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
    }
});

// ProjectList
// -----------
// Collection. All project models.
var ProjectList = Backbone.Collection.extend({
    model: Project,
    url: 'api/Project',
    comparator: function(project) {
        return project.get('id');
    }
});

// Export
// ------
// Model. Describes a single export task, e.g. rendering a map to a PDF.
var Export = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true
            },
            'project': {
                'type': 'string',
                'required': true
            },
            'format': {
                'type': 'string',
                'required': true,
                'enum': ['png', 'pdf', 'mbtiles']
            },
            'status': {
                'type': 'string',
                'required': true,
                'enum': ['waiting', 'processing', 'complete', 'error']
            },
            'progress': {
                'type': 'number',
                'minimum': 0,
                'maximum': 1
            },
            'filename': {
                'type': 'string',
                'pattern': '^[A-Za-z0-9\-_.]+$'
            },
            'created': {
                'type': 'integer'
            },
            'updated': {
                'type': 'integer'
            },
            'error': {
                'type': 'string'
            }
        }
    },
    initialize: function() {
        this.isNew() && this.set({created: +new Date});
    },
    url: function() {
        return 'api/Export/' + this.id;
    },
    defaults: {
        progress: 0,
        status: 'waiting'
    },
    // Generate a download URL for an Export.
    downloadURL: function() {
        return (this.get('status') === 'complete') && 'export/download/' + this.get('filename');
    },
    // Get the duration of the current export job.
    time: function() {
        if (this.get('updated')) {
            var seconds = parseInt((this.get('updated') - this.get('created')) * .001, 10);
            var minutes = parseInt(seconds / 60, 10);
            var remainder = seconds - (minutes * 60);
            if (minutes && remainder) {
                return minutes + ' min ' + remainder + ' sec';
            } else if (minutes) {
                return minutes + ' min';
            } else {
                return seconds + ' sec';
            }
        }
        return '0 sec';
    }
});

// ExportList
// ----------
// Collection. List of all Exports.
var ExportList = Backbone.Collection.extend({
    model: Export,
    url: 'api/Export',
    comparator: function(job) {
        return job.get('created');
    }
});

// Asset
// -----
// Model. Single external asset, e.g. a shapefile, image, etc.
var Asset = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true
            },
            'url': {
                'type': 'string',
                'required': true
            },
            'bytes': {
                'type': 'string'
            }
        }
    },
    extension: function() {
        return this.id.split('.').pop();
    }
});

// AssetList
// ---------
// Collection. List of all assets for a given Library. Must be given a
// Library model at `options.library` in order to determine its URL endpoint.
// The REST endpoint for a LibraryList collection must return an array of asset
// models, or may optionally return a more complex object suited for handling
// pagination:
//
//      {
//          page: 0,        // The current page number
//          pageTotal: 10,  // The total number of pages
//          models: []      // An array of asset models
//      }
var AssetList = Backbone.Collection.extend({
    model: Asset,
    url: function() {
        return 'api/Library/' + this.library.id + '/assets/' + this.page;
    },
    initialize: function(options) {
        this.page = 0;
        this.pageTotal = 1;
        this.library = options.library;
    },
    parse: function(response) {
        if (_.isArray(response)) {
            return response;
        } else {
            this.page = response.page;
            this.pageTotal = response.pageTotal;
            return response.models;
        }
    },
    hasNext: function() {
        return this.page < (this.pageTotal - 1);
    },
    hasPrev: function() {
        return this.page > 0;
    },
    nextPage: function(options) {
        if (!this.hasNext()) return;
        this.page++;
        this.fetch(options);
    },
    prevPage: function(options) {
        if (!this.hasPrev()) return;
        this.page--;
        this.fetch(options);
    }
});

// AssetListS3
// -----------
// Collection. Override of AssetList for S3 library. S3 uses a marker key
// system for pagination instead of a page # system.
var AssetListS3 = AssetList.extend({
    url: function() {
        var url = 'api/Library/' + this.library.id + '/assets';
        if (this.marker()) {
            url += '/' + Base64.encodeURI(this.marker());
        }
        return url;
    },
    initialize: function(options) {
        this.markers = [];
        this.library = options.library;
    },
    marker: function() {
        if (this.markers.length) {
            return this.markers[this.markers.length - 1];
        }
        return false;
    },
    parse: function(response) {
        if (this.marker() != response.marker) {
            this.markers.push(response.marker);
        }
        return response.models;
    },
    hasNext: function() {
        return this.marker();
    },
    hasPrev: function() {
        return this.markers.length > 1;
    },
    nextPage: function(options) {
        if (!this.hasNext()) return;
        this.fetch(options);
    },
    prevPage: function(options) {
        if (!this.hasPrev()) return;
        this.markers.pop();
        this.markers.pop();
        this.fetch(options);
    }
});

// Library
// --------
// Model. Stores settings for a given asset library type, e.g. a local file
// directory or an Amazon S3 bucket.
var Library = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true,
                'minLength': 1
            },
            'type': {
                'type': 'string',
                'required': true,
                'enum': ['s3', 'directory']
            },
            'name': {
                'type': 'string',
                'required': true,
                'minLength': 1
            },
            's3_bucket': {
                'type': 'string',
                'required': true,
                'minLength': 1
            },
            's3_key': {
                'type': 'string',
                'required': true,
                'minLength': 1
            },
            's3_secret': {
                'type': 'string',
                'required': true,
                'minLength': 1
            },
            'directory_path': {
                'type': 'string',
                'required': true,
                'minLength': 1
            }
        },
        'dependencies': {
            's3_bucket': {
                'properties': {
                    'type': { 'enum': ['s3'], 'required': true }
                }
            },
            's3_key': {
                'properties': {
                    'type': { 'enum': ['s3'], 'required': true }
                }
            },
            's3_secret': {
                'properties': {
                    'type': { 'enum': ['s3'], 'required': true }
                }
            },
            'directory_path': {
                'properties': {
                    'type': { 'enum': ['directory'], 'required': true }
                }
            }
        }
    },
    url: function() {
        return 'api/Library/' + this.id;
    },
    defaults: {
        type: 'directory'
    },
    initialize: function(options) {
        switch (this.get('type')) {
        case 's3':
            this.assets = new AssetListS3({ library: this });
            break;
        default:
            this.assets = new AssetList({ library: this });
            break;
        }
    }
});

// LibraryList
// ------------
// Collection. All librarys.
var LibraryList = Backbone.Collection.extend({
    model: Library,
    url: 'api/Library',
    comparator: function(model) {
        return model.get('name');
    }
});

(typeof module !== 'undefined') && (module.exports = {
    Asset: Asset,
    AssetList: AssetList,
    AssetListS3: AssetListS3,
    Library: Library,
    LibraryList: LibraryList,
    Project: Project,
    ProjectList: ProjectList,
    Export: Export,
    ExportList: ExportList,
    Datasource: Datasource,
    Settings: Settings
});

