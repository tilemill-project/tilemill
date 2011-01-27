// Require Backbone, underscore, if we're on the server.
// @TODO if we use the keyword 'var' in front of Backbone, _, IE will wipe the
// globally defined Backbone and underscore leaving us with broken objects.
// This is obviously not ideal.
if (typeof require !== 'undefined') {
    Backbone = require('backbone-filesystem');
    _ = require('underscore')._;
}

/**
 * Model: Abilities
 *
 * Read-only model describing the abilities of TileLive's Mapnik backend.
 */
var Abilities = Backbone.Model.extend({ url: '/api/abilities' });

/**
 * Model: Settings
 *
 * Settings model. Stores any user-specific configuration related to the app.
 */
var Settings = Backbone.Model.extend({
    /**
     * Model name used for storage.
     */
    type: 'settings',
    /**
     * Override url() method for convenience so we don't always need a
     * collection reference around for CRUD operations on a single model.
     */
    url: function() {
        return '/api/Settings/' + this.id;
    },
    /**
     * Validate settings.
     */
    validate: function(attributes) {
        if (typeof attributes.mode !== 'undefined' && attributes.mode !== 'normal' && attributes.mode !== 'minimal') {
            return 'Invalid editor mode specified.';
        }
    }
});

/**
 * Model: Stylesheet
 *
 * This model is *not* backed directly by the server.
 * It is a child model of Project and is saved serialized as part of the parent
 * Project model.
 */
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

/**
 * Collection: StylesheetList
 *
 * This collection is *not* backed directly by the server.
 * This collection is a child of the Project model. When it is updated
 * (add/remove events) it updates the attributes of its parent model as well.
 */
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

/**
 * Model: Layer
 *
 * This model is *not* backed directly by the server.
 * It is a child model of Project and is saved serialized as part of the parent
 * Project model.
 */
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

/**
 * Collection: LayerList
 *
 * This collection is *not* backed directly by the server.
 * This collection is a child of the Project model. When it is updated
 * (add/remove events) it updates the attributes of its parent model as well.
 */
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

/**
 * Model: Datasource
 *
 * This is a read-only model of inspection metadata about a map layer.
 */
var Datasource = Backbone.Model.extend({
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes, options) {
        this.set({'fields': attributes.fields});
    },
    url: function() {
        return '/api/Datasource/' + Base64.urlsafe_encode(this.get('url'));
    }
});

/**
 * Model: Project
 *
 * This model represents a single TileMill project. It is used both client-side
 * and server-side for setting defaults and handling validation.
 */
var Project = Backbone.Model.extend({
    SRS_DEFAULT: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 '
    + '+lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
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
        + '+lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
        geometry: 'polygon',
        Datasource: {
            file: 'http://tilemill-data.s3.amazonaws.com/world_borders_merc.zip',
            type: 'shape'
        }
    }],
    /**
     * Model name used for storage.
     */
    type: 'project',
    /**
     * Custom setDefaults() method for creating a project with default layers,
     * stylesheets, etc. Note that we do not use Backbone native initialize()
     * or defaults(), both of which make default values far pervasive than the
     * expected use here.
     */
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
    /**
     * Instantiate StylesheetList and LayerList collections from JSON lists
     * of plain JSON objects.
     */
    parse: function(response) {
        var self = this;
        response.Stylesheet = new StylesheetList(response.Stylesheet ?
                response.Stylesheet :
                [], { parent: this });
        response.Layer = new LayerList(response.Layer ?
                response.Layer : [], { parent: this });
        return response;
    },
    /**
     * Override url() method for convenience so we don't always need a
     * collection reference around for CRUD operations on a single model.
     */
    url: function() {
        return '/api/Project/' + this.id;
    },
    /**
     * Base64 encode this project's MML URL.
     */
    project64: function(options) {
        // `window.location.origin` is not available in all browsers like
        // Firefox. @TODO This approach won't allow TileMill to be installed in
        // a subdirectory. Fix.
        var url = [
            window.location.protocol,
            window.location.host].join('//') + this.url();
        if (options.signed) {
            var md5 = new MD5();
            url += '?' + md5.digest(JSON.stringify(this)).substr(0, 6);
        }
        return Base64.urlsafe_encode(url);
    },
    /**
     * Layer URL based on the model URL.
     */
    layerURL: function(options) {
        return [window.location.protocol, window.location.host].join('//') + '/';
    },
    /**
     * Native Backbone validation method.
     */
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
    /**
     * Custom validation method that allows for asynchronous processing.
     * Expects options.success and options.error callbacks to be consistent
     * with other Backbone methods.
     */
    validateAsync: function(options) {
        // If client-side, pass-through.
        if (typeof require === 'undefined') { options.success(this, null) }

        var Step = require('step'),
            mess = require('mess'),
            mapnik = require('mapnik'),
            that = this,
            stylesheets = this.get('Stylesheet');
        var stylesheets = stylesheets instanceof StylesheetList
            ? stylesheets.toJSON()
            : stylesheets;
        Step(
            function() {
                var group = this.group();
                var env = {
                    returnErrors: true,
                    errors: [],
                    validation_data: {
                        fonts: mapnik.fonts()
                    },
                    deferred_externals: [],
                    effects: []
                };
                if (stylesheets.length !== 0) {
                    _.each(stylesheets, function(stylesheet) {
                        new(mess.Parser)({ filename: stylesheet.id })
                            .parse(stylesheet.data, function(err, tree) {
                            if (!err) {
                                try {
                                    var errors = null;
                                    var l = tree.toList(env);
                                    l.map(function(t) {
                                        t.toXML(env);
                                    });
                                    if (env.errors.length) {
                                        var lined_errors = env.errors.map(function(r) {
                                            // TODO: line numbers are one less
                                            // than expected.
                                            r.line = tree.getLine(r.index) + 1;
                                            r.filename = stylesheet.id;
                                            return r;
                                        });
                                        group()(lined_errors);
                                    }
                                    else {
                                        group()(null);
                                    }
                                } catch (e) {
                                    group()([e]);
                                }
                            } else {
                                group()([ err ]);
                            }
                        });
                    });
                }
                else {
                    group()('No stylesheets found.');
                }
            },
            function(err, res) {
                if (err) {
                    options.error(that, err);
                }
                else {
                    options.success(that, null);
                }
            }
        );
    }
});

/**
 * Collection: ProjectList
 *
 * Collection of project models.
 */
var ProjectList = Backbone.Collection.extend({
    model: Project,
    url: '/api/Project',
    /**
     * Model name used for storage.
     */
    type: 'project',
    comparator: function(project) {
        return project.get('id');
    }
});

/**
 * Model: Export
 *
 * Job model.
 */
var Export = Backbone.Model.extend({
    /**
     * Model name used for storage.
     */
    type: 'export',
    initialize: function() {
        if (this.isNew()) {
            this.set({created: +new Date});
            if (typeof MD5 !== 'undefined') {
                var md5 = new MD5();
                var date = new Date();
                md5.digest(JSON.stringify(this)).substr(0, 6);
                this.set({'id': md5.digest(JSON.stringify(this) + date.getTime()).substr(0, 6)});
            }
        }
    },
    /**
     * Override url() method for convenience so we don't always need a
     * collection reference around for CRUD operations on a single model.
     */
    url: function() {
        return '/api/Export/' + this.id;
    },
    defaults: {
        progress: 0,
        status: 'waiting'
    },
    validate: function(attributes) {
        if (attributes.status && ['waiting', 'processing', 'complete', 'error'].indexOf(attributes.status) === -1) {
            return 'Invalid status.';
        }
        if (attributes.progress && (typeof attributes.progress !== 'number' || attributes.progress > 1 || attributes.progress < 0)) {
            return 'Progress must be a value between 0 and 1 (inclusive).';
        }
    },
    /**
     * Generate a download URL for a model.
     */
    downloadURL: function() {
        return (this.get('status') === 'complete') && '/export/download/' + this.get('filename');
    },
    /**
     * Allow the export to add tasks to the task queue.
     */
    doExport: function(callback) {
        return require('export').doExport(this, callback);
    },
    /**
     * Get the duration of the current export job.
     */
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

/**
 * Collection: ExportList
 *
 * A queue of job models.
 */
var ExportList = Backbone.Collection.extend({
    model: Export,
    url: '/api/Export',
    /**
     * Model name used for storage.
     */
    type: 'export',
    comparator: function(job) {
        return job.get('created');
    }
});

if (typeof module !== 'undefined') {
    module.exports = {
        Project: Project,
        ProjectList: ProjectList,
        Export: Export,
        ExportList: ExportList,
        Datasource: Datasource,
        Settings: Settings
    };
}

