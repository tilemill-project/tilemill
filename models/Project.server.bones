var fs = require('fs');
var Step = require('step');
var path = require('path');
var read = require('../lib/fsutil.js').read;
var readdir = require('../lib/fsutil.js').readdir;
var mkdirp = require('../lib/fsutil.js').mkdirp;
var rm = require('../lib/fsutil.js').rm;
var carto = require('carto');
var mapnik = require('mapnik');
var EventEmitter = require('events').EventEmitter;
var millstone = require('millstone');
var settings = Bones.plugin.config;

// Project
// -------
// Implement custom sync method for Project model. Writes projects to
// individual directories and splits out Stylesheets from the main project
// MML JSON file.
models.Project.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        if (model.id) {
            loadProject(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        } else {
            loadProjectAll(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        }
        break;
    case 'create':
    case 'update':
        saveProject(model, function(err, model) {
            return err ? error(err) : success(model);
        });
        break;
    case 'delete':
        destroyProject(model, function(err) {
            return err ? error(err) : success({});
        });
        break;
    // Custom sync method for Project model. A sync request is made with the
    // `_updated` attr of the model set. The mtime of the model is first
    // checked -- if it is later than the provided time a full read is done,
    // otherwise no attributes are returned to be updated.
    case 'mtime':
        mtimeProject(model, function(err, mtime) {
            if (mtime > model.get('_updated')) {
                loadProject(model, function(err, model) {
                    return err ? error(err) : success(model);
                });
            } else {
                success({});
            }
        });
        break;
    // Custom sync method to flush the cache for a specific model. Requires
    // `model.options.layer` to be set.
    case 'flush':
        flushProject(model, function(err) {
            return err ? error(err) : success({});
        });
        break;
    }
};

// Custom validation method that allows for asynchronous processing.
// Expects options.success and options.error callbacks to be consistent
// with other Backbone methods. Catches three main types of errors:
// - localize failure
// - carto compilation failure
// - limited mapnik "test render" failure
models.Project.prototype.validateAsync = function(attributes, options) {
    var mml = _(attributes).clone();

    // Set _updated to 0 to force a localize cache clear.
    mml._updated = 0;

    this.localize(mml, function(err) {
        if (err) return options.error(this, err);

        var map = new mapnik.Map(1,1);
        var im = new mapnik.Image(1,1);
        map.fromString(this.xml, {
            strict:false,
            base:path.join(Bones.plugin.config.files, 'project', this.id) + '/'
        }, function(err, map) {
            if (err) return options.error(this, err);
            map.bufferSize = 0;
            map.extent = [0,0,0,0];
            map.render(im, {format:'png'}, function(err) {
                if (err) return options.error(this, err);
                options.success(this, null);
            }.bind(this));
        });
    }.bind(this));
};

// Wrap save to call validateAsync first.
models.Project.prototype.save = _(Backbone.Model.prototype.save)
.wrap(function(parent, attrs, options) {
    var err = this.validate(attrs);
    if (err) return options.error(this, err);

    this.validateAsync(attrs, {
        success: _(function() {
            parent.call(this, attrs, options);
        }).bind(this),
        error: options.error
    });
});

// Flush the cache for a project's layer.
function flushProject(model, callback) {
    if (!model.options || !model.options.layer)
        return callback(new Error('options.layer required.'));
    if (!model.options || !model.options.url)
        return callback(new Error('options.url required.'));

    var options = {
        url: model.options.url,
        layer: model.options.layer,
        base: path.join(settings.files, 'project', model.id),
        cache: path.join(settings.files, 'cache')
    };
    millstone.flush(options, callback);
}

// Get the mtime for a project.
function mtimeProject(model, callback) {
    var modelPath = path.resolve(path.join(settings.files, 'project', model.id));
    readdir(modelPath, function(err, files) {
        if (err) return callback(err);
        var max = _(files).chain()
            .filter(function(stat) { return stat.isFile() })
            .pluck('mtime')
            .map(Date.parse)
            .max()
            .value();
        callback(null, max);
    });
}

// Migrate a TileJSON 1.0.0 project to 2.0.0
function migrate100_200(object) {
    function formatterToTemplate(formatter) {
        return formatter.replace(/\[([\w\d]+)\]/g, '{{{$1}}}');
    }
    if (object.interactivity) {
        _([
          'template_teaser',
          'template_full',
          'template_location']).each(function(t) {
            if (object.interactivity[t]) {
                object.interactivity[t] = formatterToTemplate(object.interactivity[t]);
            }
        });
    }
    return object;
}

// Load a single project model.
function loadProject(model, callback) {
    var modelPath = path.resolve(path.join(settings.files, 'project', model.id));
    var object = {};
    Step(function() {
        mtimeProject(model, this);
    },
    function(err, mtime) {
        object._updated = mtime;
        read(path.join(modelPath, model.id) + '.mml', this);
    },
    function(err, file) {
        if (err) return callback(new Error.HTTP('Project does not exist', 404));
        try {
            object = _(object).extend(JSON.parse(file.data));
        } catch(err) {
            throw err;
        }

        object.id = model.id;
        if (object.Stylesheet && object.Stylesheet.length > 0) {
            var group = this.group();
            object.Stylesheet.forEach(function(filename) {
                read(path.join(modelPath, filename), group());
            });
        } else {
            this(null, []);
        }
    },
    function(err, stylesheets) {
        if (err && err.code === 'ENOENT') {
            stylesheets = _(stylesheets).compact();
        } else if (err) {
            return this(err);
        }

        // Embed stylesheet contents at the `Stylesheet` key.
        object.Stylesheet = _(stylesheets).map(function(file) {
            return {
                id: file.basename,
                data: file.data
            };
        });

        // Migrate old properties to tilejson equivalents.
        ['_center', '_format', '_interactivity', '_legend'].forEach(function(k) {
            if (!object[k]) return;
            object[k.substr(1)] = object[k.substr(1)] || object[k];
            delete object[k];
        });
        if (object.center && !_(object.center).isArray()) {
            object.center = [
                object.center.lon || 0,
                object.center.lat || 0,
                object.center.zoom || 0
            ];
        }

        // TileJSON version migration
        switch (object.tilejson) {
            // Current version should be at the top
            case '2.0.0':
                break;
            // version-less object is 1.0.0
            default:
                object = migrate100_200(object);
                break;
        }

        // Generate dynamic properties.
        object.tilejson = '2.0.0';
        object.scheme = 'xyz';
        object.tiles = ['/tile/' + model.id + '/{z}/{x}/{y}.' +
            (object.format || 'png') +
            '?updated=' + object._updated];
        object.grids = ['/tile/' + model.id + '/{z}/{x}/{y}.grid.json' +
            '?updated=' + object._updated];
        if (object.interactivity) {
            object.template = template(object.interactivity);
            object.interactivity.fields = fields(object);
        }
        this();
    },
    function(err) {
        return callback(err, object);
    });
}

// Load all projects into an array.
function loadProjectAll(model, callback) {
    var basepath = path.resolve(path.join(settings.files, 'project'));
    Step(function() {
        mkdirp(basepath, 0777, this);
    },
    function(err) {
        if (err) return callback(err);
        readdir(basepath, this);
    },
    function(err, files) {
        if (err) return callback(err);
        if (files.length === 0) return this(null, []);
        var group = this.group();
        _(files).chain()
            .filter(function(file) { return file.isDirectory() })
            .each(function(file) { loadProject({id:file.basename}, group()) });
    },
    function(err, models) {
        // Ignore errors from loading individual models (e.g.
        // don't let one bad apple spoil the collection).
        models = _(models).select(function(model) {
            return model && model.id
        });
        return callback(null, models);
    });
}

// Destroy a project. `rm -rf` equivalent for the project directory.
function destroyProject(model, callback) {
    var modelPath = path.resolve(path.join(settings.files, 'project', model.id));
    rm(modelPath, callback);
}

// Save a project. Creates a subdirectory per project and splits out
// stylesheets into separate files.
function saveProject(model, callback) {
    var modelPath = path.resolve(path.join(settings.files, 'project', model.id));
    Step(function() {
        mkdirp(modelPath, 0777, this);
    },
    function(err) {
        if (err) throw err;
        // Hard clone the model JSON before doing adjustments to the data
        // based on writing separate stylesheets.
        var data = JSON.parse(JSON.stringify(model.toJSON()));
        var files = {};
        var schema = model.schema.properties;
        files[model.id + '.mml'] = {};

        data.Stylesheet = _(data.Stylesheet).map(function(s) {
            if (s.id) files[s.id] = s.data;
            return s.id || s;
        });

        _(data).chain()
            .keys()
            .filter(function(k) { return schema[k] && !schema[k].ignore })
            .each(function(k) { files[model.id + '.mml'][k] = data[k]; });

        var group = this.group();
        _(files).each(function(data, filename) {
            fs.writeFile(
                path.join(modelPath, filename),
                _(data).isString() ? data : JSON.stringify(data, null, 2),
                group()
            );
        });
    },
    function(err) {
        if (err) throw err;
        fs.stat(path.join(modelPath, model.id + '.mml'), this);
    },
    function(err, stat) {
        var updated = stat && Date.parse(stat.mtime) || (+ new Date());
        callback(err, {
            _updated: updated,
            tiles: ['/tile/' + model.id + '/{z}/{x}/{y}.' +
                (model.get('format') || 'png') +
                '?updated=' + updated],
            grids: ['/tile/' + model.id + '/{z}/{x}/{y}.grid.json' +
                '?updated=' + updated],
            template: model.get('interactivity')
                ? template(model.get('interactivity'))
                : undefined
        });
    });
}

function compileStylesheet(mml, callback) {
    // Parse project stylesheets for `font-directory` property and register
    // font path if it is present so that `validation_data` includes fonts from
    // this directory.
    // @TODO Probably the only more reasonable way to do this would be to have
    // carto expand validation data dynamically to include this dir when it
    // comes across this map property. Gross....
    var styles = _(mml.Stylesheet || []).pluck('data').join('\n');
    var fonts = styles.match(/font-directory:[\s]*url\(['"]*([^'"\)]*)['"]*\)/);
    if (fonts) {
        fonts = fonts[1];
        fonts = fonts.charAt(0) !== '/'
            ? path.join(settings.files, 'project', mml.id, fonts)
            : fonts;
        mapnik.register_fonts(fonts);
    }

    var env = {
        validation_data: { fonts: mapnik.fonts() },
        returnErrors: true,
        effects: []
    };

    // Hard clone the model JSON to avoid any alterations to it.
    // @TODO: is this necessary?
    var data = JSON.parse(JSON.stringify(mml));
    new carto.Renderer(env).render(data, function(err, output) {
        if (err) callback(err);
        else callback(null, output);
    });
}

var localizedCache = {};

// Localizes an MML file and compiles the stylesheet for use in tilelive-mapnik.
models.Project.prototype.localize = function(mml, callback) {
    var model = this;
    var key = path.join(settings.files, 'project', model.id);

    function done() {
        model.xml = localizedCache[key].xml;
        model.mml = localizedCache[key].mml;
        model.debug = localizedCache[key].debug;
        callback(null);
    }

    if (localizedCache[key]) {
        if (mml._updated === 0) {
            // Caller may set _updated to 0 to force a cache clear.
            delete localizedCache[key];
        } else if (localizedCache[key].updated < mml._updated) {
            // The existing item is outdated.
            delete localizedCache[key];
        } else if (localizedCache[key].mml && localizedCache[key].xml) {
            // This is already loaded.
            return done();
        } else {
            return localizedCache[key].once('load', done);
        }
    }

    // Actually load the object.
    localizedCache[key] = new EventEmitter;
    localizedCache[key].debug = {};
    localizedCache[key].updated = mml._updated;
    localizedCache[key].setMaxListeners(0);
    localizedCache[key].once('load', done);

    var localizeTime;
    var compileTime;
    Step(function() {
        localizeTime = (+new Date);
        millstone.resolve({
            mml: mml,
            base: path.join(settings.files, 'project', model.id),
            cache: path.join(settings.files, 'cache')
        }, this);
    }, function(err, localized) {
        if (err) return callback(err);

        localizedCache[key].debug.localize = (+new Date) - localizeTime + 'ms';
        localizedCache[key].mml = localized;

        compileTime = (+new Date);
        compileStylesheet(localized, this);
    }, function(err, compiled) {
        if (err) return callback(err);

        localizedCache[key].debug.compile = (+new Date) - compileTime + 'ms';
        localizedCache[key].xml = compiled;
        localizedCache[key].emit('load');
    });
};

// Generate list of fields from model attributes.
function fields(opts) {
    opts = opts || {};
    opts.interactivity = opts.interactivity || {};
    var full = opts.interactivity.template_full || '';
    var teaser = opts.interactivity.template_teaser || '';
    var location = opts.interactivity.template_location || '';

    // Determine fields that need to be included from templates.
    // @TODO allow non-templated fields to be included.
    var fields = [full, teaser, location]
        .join(' ').match(/\{\{#?\/?\^?([\w\d]+)\}\}/g);

    // Include `key_field` for PostGIS Layers.
    var layer = opts.interactivity.layer;
    _(opts.Layer).each(function(l) {
        if (l.id !== opts.interactivity.layer) return;
        if (l.Datasource && l.Datasource.key_field)
            fields.push('{{{' + l.Datasource.key_field + '}}}');
    });

    return _(fields).chain()
        .filter(_.isString)
        .map(function(field) {
            return field.replace(/[\{\{|\}\}]/g, '');
        })
        .uniq()
        .value();
}

// Generate combined template from templates.
function template(opts) {
    opts = opts || {};
    return '{{#__location__}}' + (opts.template_full || '') + '{{/__location__}}' +
        '{{#__teaser__}}' + (opts.template_teaser || '') + '{{/__teaser__}}' +
        '{{#__full__}}' + (opts.template_full || '') + '{{/__full__}}';
}
