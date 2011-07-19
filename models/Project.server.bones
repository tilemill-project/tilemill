var fs = require('fs');
var Step = require('step');
var path = require('path');
var read = require('../lib/fsutil.js').read;
var readdir = require('../lib/fsutil.js').readdir;
var mkdirp = require('../lib/fsutil.js').mkdirp;
var rm = require('../lib/fsutil.js').rm;
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
    }
};

// Load a single project model.
function loadProject(model, callback) {
    var modelPath = path.join(settings.files, 'project', model.id);
    var object = {};
    Step(function() {
        read(path.join(modelPath, model.id) + '.mml', this);
    },
    function(err, file) {
        if (err) throw new Error('Error reading model file.');
        try {
            object = JSON.parse(file.data);
        } catch(err) {
            throw err;
        }

        object.id = model.id;
        object._updated = Date.parse(file.mtime);
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

        // Retrive the most current modified time from all stylesheets and
        // set to project modified time if more current than project mml.
        var mtime = _(stylesheets).chain()
            .pluck('mtime')
            .map(function(mtime) { return Date.parse(mtime); })
            .max()
            .value();
        (mtime > object._updated) && (object._updated = mtime);

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
            var updates = '+wktext +no_defs +over';
            if (normalized === legacy) obj.srs = legacy + ' ' + updates;
        });

        // Generate dynamic properties.
        object.tilejson = '1.0.0';
        object.scheme = 'tms';
        object.tiles = ['/1.0.0/' + model.id + '/{z}/{x}/{y}.' + (object.format || 'png') + '?' + object._updated];
        object.grids = ['/1.0.0/' + model.id + '/{z}/{x}/{y}.grid.json' + '?' + object._updated];
        if (object.interactivity) object.formatter = (function(opts) {
            opts = opts || {};
            var full = opts.template_full || '';
            var teaser = opts.template_teaser || '';
            var location = opts.template_location || '';
            full = _(full.replace(/\[([\w\d]+)\]/g, "<%=$1%>")).template();
            teaser = _(teaser.replace(/\[([\w\d]+)\]/g, "<%=$1%>")).template();
            location = _(location.replace(/\[([\w\d]+)\]/g, "<%=$1%>")).template();
            return _('function(o,d) { return {full:<%=full%>, teaser:<%=teaser%>, location:<%=location%>}[o.format](d); }').template({full:full, teaser:teaser, location:location});
        })(object.interactivity);
        this();
    },
    function(err) {
        return callback(err, object);
    });
};

// Load all projects into an array.
function loadProjectAll(model, callback) {
    var basepath = path.join(settings.files, 'project');
    Step(function() {
        mkdirp(basepath, 0777, this);
    },
    function(err) {
        if (err) throw err;
        readdir(basepath, this);
    },
    function(err, files) {
        if (err) throw new Error('Error reading model directory.');
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
        readdir(modelPath, this);
    },
    function(err, files) {
        if (err) throw err;

        // Remove any stale files in the project directory.
        var layers = _(model.get('Layer')).pluck('name');
        var stylesheets = _(model.get('Stylesheet')).pluck('id') || [];
        var group = this.group();
        _(files).chain()
            .select(function(file) {
                // - Directory does not match a layer name. Valid.
                // - Directory name and origin match a layer. Valid.
                // - Directory name matches and uri is a relative path. Valid.
                // - Directory name matches but origin does not. Stale or
                //   broken cache. Cleanup.
                if (file.isDirectory()) {
                    var index = layers.indexOf(file.basename);
                    var l = model.get('Layer')[index];
                    if (index === -1) return false;
                    if (!l.Datasource.file) return false;
                    if (l.Datasource.file.search('http') !== 0 &&
                        l.Datasource.file[0] !== '/') return false;
                    if (l.Datasource.file === file.origin) return false;
                }
                if (file.basename[0] === '.') return false;
                if (file.basename === model.id + '.mml') return false;
                if (_(stylesheets).include(file.basename)) return false;
                return true;
            })
            .each(function(file) {
                rm(path.join(modelPath, file.basename), group());
            });
        group()();
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
            grids: ['/1.0.0/' + model.id + '/{z}/{x}/{y}.grid.json' + '?' + updated]
        });
    });
};

