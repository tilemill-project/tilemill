// Require Backbone, underscore, if we're on the server.
// @TODO if we use the keyword 'var' in front of Backbone, _, IE will wipe the
// globally defined Backbone and underscore leaving us with broken objects.
// This is obviously not ideal.
if (typeof require !== 'undefined') {
    Backbone = require('backbone-dirty');
    _ = require('underscore')._;
}

// Abilities (read-only)
// ---------------------
// Model. Describes server API abilities.
var Abilities = Backbone.Model.extend({
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
// Model. Inspection metadata about a map layer.
var Datasource = Backbone.Model.extend({
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes, options) {
        this.set({'fields': attributes.fields});
    },
    url: function() {
        return 'api/Datasource/' + Base64.encodeURI(this.get('url'));
    }
});

// Settings
// --------
// Model. Stores any user-specific configuration related to the app.
var Settings = Backbone.Model.extend({
    type: 'settings',
    url: function() {
        return 'api/Settings/' + this.id;
    },
    validate: function(attributes) {
        if (typeof attributes.mode !== 'undefined' && attributes.mode !== 'normal' && attributes.mode !== 'minimal') {
            return 'Invalid editor mode specified.';
        }
    }
});

// Stylesheet
// ----------
// Model. Represents a single map MSS stylesheet. This model is a child of
// the Project model and is saved serialized as part of the parent.
// **This model is not backed directly by the server.**
var Stylesheet = Backbone.Model.extend({
    initialize: function() {
        if (!this.get('data')) {
            this.set({ 'data': '' });
        }
    },
    validate: function(attributes) {
        if (/^[a-z0-9\-_.]+$/i.test(attributes.id) === false) {
            return 'Name must contain no space and only letters, numbers, dashes, underscores and periods.';
        }
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
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes) {
        this.set({'Datasource': attributes.Datasource});
    },
    validate: function(attributes) {
        if (/^[a-z0-9\-_]+$/i.test(attributes.id) === false) {
            return 'ID must contain only letters, numbers, dashes, and underscores.';
        }
        if (attributes['class'] && /^[a-z0-9\-_ ]+$/i.test(attributes['class']) === false) {
            return 'Class must contain only letters, numbers, dashes, and underscores.';
        }
        if (attributes.Datasource && !attributes.Datasource.file) {
            return 'Supplying a datasource is required.';
        }
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
// can be used by `mess.js` to render a map.
var Project = Backbone.Model.extend({
    SRS_DEFAULT: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 '
    + '+lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
    STYLESHEET_DEFAULT: [{
        id: 'style.mss',
        data: 'Map {\n'
            + '  background-color: #fff;\n'
            + '}\n\n'
            + '#world {\n'
            + '  line-color: #ccc;\n'
            + '  line-width: 0.5;\n'
            + '  polygon-fill: #eee;\n'
            + '}'
    }],
    LAYER_DEFAULT: [{
        id: 'world',
        name: 'world',
        srs: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 '
        + '+lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
        geometry: 'polygon',
        Datasource: {
            file: 'http://tilemill-data.s3.amazonaws.com/world_borders_merc.zip',
            type: 'shape'
        }
    }],
    type: 'project',
    defaults: {
        '_center': { lat:0, lon:0, zoom:2 },
        '_format': 'png'
    },
    // Custom setDefaults() method for creating a project with default layers,
    // stylesheets, etc. Note that we do not use Backbone native initialize()
    // or defaults(), both of which make default values far pervasive than the
    // expected use here.
    setDefaults: function() {
        if (!this.get('srs')) {
            this.set({'srs': this.SRS_DEFAULT});
        }
        if (!this.get('Stylesheet')) {
            this.set({
                'Stylesheet': new StylesheetList(this.STYLESHEET_DEFAULT, {
                    parent: this
                })
            });
        }
        if (!this.get('Layer')) {
            this.set({
                'Layer': new LayerList(this.LAYER_DEFAULT, {
                    parent: this
                })
            });
        }
    },
    // Instantiate StylesheetList and LayerList collections from JSON lists
    // of plain JSON objects.
    parse: function(response) {
        var self = this;
        response.Stylesheet = new StylesheetList(response.Stylesheet ?
                response.Stylesheet :
                [], { parent: this });
        response.Layer = new LayerList(response.Layer ?
                response.Layer : [], { parent: this });
        return response;
    },
    url: function() {
        return 'api/Project/' + this.id;
    },
    // Return the base URL of TileMill including a single trailing slash,
    // e.g. http://localhost:8889/ or http://mapbox/tilemill/
    baseURL: function() {
        var baseURL = window.location.protocol + '//' + window.location.host;
        var args = window.location.pathname.split('/');
        // Path already ends with trailing slash.
        if (args[args.length - 1] === '') {
            return baseURL + args.join('/');
        // index.html or similar trailing filename.
        } else if (_.indexOf(args[args.length - 1], '.') !== -1) {
            args.pop();
            return baseURL + args.join('/') + '/';
        // Path beyond domain.
        } else {
            return baseURL + args.join('/') + '/';
        }
    },
    // Base64 encode this project's MML URL.
    project64: function(options) {
        // `window.location.origin` is not available in all browsers like
        // Firefox. @TODO This approach won't allow TileMill to be installed in
        // a subdirectory. Fix.
        var url = this.baseURL() + this.url();
        if (options.signed) {
            var md5 = new MD5();
            url += '?' + md5.digest(JSON.stringify(this)).substr(0, 6);
        }
        return Base64.urlsafe_encode(url);
    },
    // Layer URL based on the model URL.
    layerURL: function(options) {
        return this.baseURL();
    },
    validate: function(attributes) {
        // Test character set of model ID.
        if (typeof attributes.id !== 'undefined') {
            if (/^[a-z0-9\-_]+$/i.test(attributes.id) === false) {
                return 'Name must contain only letters, numbers, dashes, '
                    + 'and underscores.';
            }
        }
        // Test that there is at least one stylesheet.
        if (typeof attributes.Stylesheet !== 'undefined') {
            var stylesheet = attributes.Stylesheet instanceof StylesheetList
                ? attributes.Stylesheet.models
                : attributes.Stylesheet;
            if (stylesheet.length === 0) {
                return 'No stylesheets found.';
            }
            // Test that each stylesheet has a unique ID.
            var counts = _.reduce(_.pluck(stylesheet, 'id'), function(memo, val) {
                memo[val] = memo[val] ? memo[val] + 1 : 1;
                return memo;
            }, {});
            if (_.max(_.values(counts)) > 1) {
                return 'Stylesheet IDs must be unique.';
            }
        }
    },
    // Custom validation method that allows for asynchronous processing.
    // Expects options.success and options.error callbacks to be consistent
    // with other Backbone methods.
    validateAsync: function(options) {
        // If client-side, pass-through.
        if (typeof require === 'undefined') {
            return options.success(this, null);
        }

        var mess = require('mess'),
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
        var data = JSON.parse(JSON.stringify(this.toJSON()));
        new mess.Renderer(env)
            .render(data, function(err, output) {
            if (err) {
                options.error(that, err);
            } else {
                options.success(that, null);
            }
        });
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
    type: 'export',
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
    validate: function(attributes) {
        if (attributes.status && _.indexOf(['waiting', 'processing', 'complete', 'error'], attributes.status) === -1) {
            return 'Invalid status.';
        }
        if (attributes.progress && (typeof attributes.progress !== 'number' || attributes.progress > 1 || attributes.progress < 0)) {
            return 'Progress must be a value between 0 and 1 (inclusive).';
        }
    },
    // Generate a download URL for an Export.
    downloadURL: function() {
        return (this.get('status') === 'complete') && '/export/download/' + this.get('filename');
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
            url += '/' + Base64.urlsafe_encode(this.marker());
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
    type: 'library',
    url: function() {
        return 'api/Library/' + this.id;
    },
    defaults: {
        type: 'directory'
    },
    validate: function(attributes) {
        var required;
        switch (attributes.type || this.get('type')) {
        case 's3':
            required = {
                name: 'Name is required.',
                s3_bucket: 'S3 bucket is required.',
                s3_key: 'S3 access key is required.',
                s3_secret: 'S3 secret is required.'
            };
            break;
        case 'directory':
            required = {
                name: 'Name is required.',
                directory_path: 'Path is required.'
            };
            break;
        }
        for (var field in required) {
            if (!_.isUndefined(attributes[field]) && !attributes[field]) {
                return required[field];
            }
        }
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

if (typeof module !== 'undefined') {
    module.exports = {
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
    };
}

