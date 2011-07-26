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
        destroyProject(model, function(err, model) {
            return err ? error(err) : success(model);
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
        flushProject(model, function(err, model) {
            return err ? error(err) : success(model);
        });
        break;
    }
};

// Flush the cache for a project's layer.
function flushProject(model, callback) {
    if (!model.options || !model.options.layer)
        return callback(new Error('options.layer required.'));

    var layer = model.options.layer;
    var modelPath = path.join(settings.files, 'project', model.id);

    Step(function() {
        read(path.join(modelPath, model.id) + '.mml', this);
    },
    function(err, file) {
        if (err) throw err;

        // Check that the layer exists.
        try { var project = JSON.parse(file.data); }
        catch(err) { throw err; }
        if (!_(project.Layer).chain().pluck('id').include(layer).value())
            throw new Error('Layer not found.');
        fs.stat(path.join(modelPath, layer), this);
    },
    function(err, stat) {
        if (err) throw err;
        if (!stat.isDirectory()) throw new Error('Cache is not a directory.');
        rm(path.join(modelPath, layer), this);
    },
    function(err) {
        if (err) return callback(err);
        return callback(null);
    });
};

// Get the mtime for a project.
function mtimeProject(model, callback) {
    var modelPath = path.join(settings.files, 'project', model.id);
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
};

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
        if (err) throw err;

        // Embed stylesheet contents at the `Stylesheet` key.
        object.Stylesheet = _(stylesheets).map(function(file) {
            return { id: file.basename, data: file.data };
        });

        // Migrate underscore properties to normal equivalents.
        ['_center', '_format', '_interactivity'].forEach(function(k) {
            if (!object[k]) return;
            object[k.substr(1)] = object[k.substr(1)] || object[k];
            delete object[k];
        });
        // Migrate from old center format to TileJSON compliant.
        if (object.center && !_(object.center).isArray()) {
            object.center = [
                object.center.lon || 0,
                object.center.lat || 0,
                object.center.zoom || 0
            ];
        }

        // Migrate project, layer SRS strings.
        // Normalizes srs by finding relevant proj arguments to compare.
        [object].concat(object.Layer || []).forEach(function(obj) {
            if (!obj.srs) return;

            var normalized = _(obj.srs.split(' ')).chain()
                .select(function(s) { return s.indexOf('=') > 0 })
                .sortBy(function(s) { return s })
                .value()
                .join(' ');
            var legacy = '+a=6378137 +b=6378137 +k=1.0 +lat_ts=0.0 +lon_0=0.0 +nadgrids=@null +proj=merc +units=m +x_0=0.0 +y_0=0';
            if (normalized === legacy) obj.srs = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over';
        });

        // Generate dynamic properties.
        object.tilejson = '1.0.0';
        object.scheme = 'tms';
        object.tiles = ['/1.0.0/' + model.id + '/{z}/{x}/{y}.' + (object.format || 'png') + '?' + object._updated];
        object.grids = ['/1.0.0/' + model.id + '/{z}/{x}/{y}.grid.json' + '?' + object._updated];
        if (object.interactivity)
            object.formatter = models.Project.formatter(object.interactivity);
        this();
    },
    function(err) {
        return callback(err, object);
    });
};

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
};

// Destroy a project. `rm -rf` equivalent for the project directory.
function destroyProject(model, callback) {
    var modelPath = path.join(settings.files, 'project', model.id);
    rm(modelPath, callback);
}

// Save a project. Creates a subdirectory per project and splits out
// stylesheets into separate files.
function saveProject(model, callback) {
    var modelPath = path.join(settings.files, 'project', model.id);
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
            tiles: ['/1.0.0/' + model.id + '/{z}/{x}/{y}.' + (model.get('format') || 'png') + '?' + updated],
            grids: ['/1.0.0/' + model.id + '/{z}/{x}/{y}.grid.json' + '?' + updated],
            formatter: model.get('interactivity')
                ? models.Project.formatter(model.get('interactivity'))
                : undefined
        });
    });
};

function compileStylesheet(mml, callback) {
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
};

// Hang the formatter compiler off the model object so it can
// be used by the export command. See `commands/export.bones`.
models.Project.formatter = function(opts) {
    opts = opts || {};
    var full = opts.template_full || '';
    var teaser = opts.template_teaser || '';
    var location = opts.template_location || '';
    full = _(full.replace(/\[([\w\d]+)\]/g, "<%=$1%>")).template();
    teaser = _(teaser.replace(/\[([\w\d]+)\]/g, "<%=$1%>")).template();
    location = _(location.replace(/\[([\w\d]+)\]/g, "<%=$1%>")).template();
    return _('function(o,d) { return {full:<%=full%>, teaser:<%=teaser%>, location:<%=location%>}[o.format](d); }').template({full:full, teaser:teaser, location:location});
};

var localizedCache = {};

// Localizes an MML file and compiles the stylesheet for use in tilelive-mapnik.
models.Project.prototype.localize = function(mml, callback) {
    var model = this;
    var key = path.join(settings.files, 'project', model.id);

    function done() {
        model.xml = localizedCache[key].xml;
        model.mml = localizedCache[key].mml;
        callback(null);
    }

    if (localizedCache[key]) {
        if (localizedCache[key].updated < mml._updated) {
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
    localizedCache[key].updated = mml._updated;
    localizedCache[key].setMaxListeners(0);
    localizedCache[key].once('load', done);

    Step(function() {
        millstone.resolve({
            mml: mml,
            base: path.join(settings.files, 'project', model.id),
            cache: path.join(settings.files, 'cache')
        }, this)
    }, function(err, localized) {
        if (err) return callback(err);

        localizedCache[key].mml = localized;
        compileStylesheet(localized, this);
    }, function(err, compiled) {
        if (err) return callback(err);
        localizedCache[key].xml = compiled;
        localizedCache[key].emit('load');
    });
};

// Hang the field parser compiler off the model object so it can
// be used by the export command. See `commands/export.bones`.
models.Project.fields = function(opts) {
    opts = opts || {};
    var full = opts.template_full || '';
    var teaser = opts.template_teaser || '';
    var location = opts.template_location || '';

    // Determine fields that need to be included from templates.
    // @TODO allow non-templated fields to be included.
    var fields = [full, teaser, location]
        .join(' ').match(/\[([\w\d]+)\]/g);
    return _(fields).chain()
        .filter(_.isString)
        .map(function(field) { return field.replace(/[\[|\]]/g, ''); })
        .uniq()
        .value();
};

