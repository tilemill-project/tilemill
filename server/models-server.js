// Server-side overrides for the Backbone models defined in `shared/models.js`.
// Provides model-specific storage overrides.
var _ = require('underscore')._,
    Backbone = require('backbone'),
    settings = require('settings'),
    fs = require('fs'),
    Step = require('step'),
    Pool = require('generic-pool').Pool,
    Worker = require('worker').Worker,
    path = require('path'),
    models = require('models'),
    constants = (!process.EEXIST >= 1) ?
        require('constants') :
        { EEXIST: process.EEXIST };

// Project
// -------
// Implement custom sync method for Project model. Writes projects to
// individual directories and splits out Stylesheets from the main project
// MML JSON file.
models.ProjectList.prototype.sync =
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

// Returns a file stat object with additional `data` and `basename` properties.
function read(filepath, callback) {
    fs.stat(filepath, function(err, stat) {
        if (err) return callback(err);
        fs.readFile(filepath, 'utf8', function(err, data) {
            if (err) return callback(err);
            stat.data = data;
            stat.basename = path.basename(filepath);
            callback(null, stat);
        });
    });
};

// Returns an array of stat objects with additional `basename` property.
// If the file is a directory, looks for a `.origin` file and adds an
// `.origin` property.
function readdir(filepath, callback) {
    fs.readdir(filepath, function(err, files) {
        if (err) return callback(err);
        if (!files.length) return callback(null, []);
        var stats = [];
        var s = function(file, attr) {
            attr = attr || {};
            fs.stat(path.join(filepath, file), function(err, stat) {
                if (err) return callback(err);
                _(stat).extend(attr);
                stats.push(stat);
                stats.length === files.length && callback(null, stats);
            });
        };
        _(files).each(function(file) {
            var origin = path.join(filepath, file, '.origin');
            path.exists(origin, function(exists) {
                if (exists) {
                    fs.readFile(origin, 'utf8', function(err, uri) {
                        s(file, {basename: file, origin: uri});
                    });
                } else {
                    s(file, {basename: file});
                }
            });
        });
    });
};

// https://gist.github.com/707661
function mkdirp(p, mode, f) {
    var cb = f || function() {};
    if (p.charAt(0) != '/') {
        cb('Relative path: ' + p);
        return;
    }

    var ps = path.normalize(p).split('/');
    path.exists(p, function(exists) {
        if (exists) return cb(null);
        mkdirp(ps.slice(0, -1).join('/'), mode, function(err) {
            if (err && err.errno != constants.EEXIST) return cb(err);
            fs.mkdir(p, mode, cb);
        });
    });
};

// Recursive rm.
function rm(filepath, callback) {
    var killswitch = false;
    fs.stat(filepath, function(err, stat) {
        if (err) return callback(err);
        if (stat.isFile()) return fs.unlink(filepath, callback);
        if (!stat.isDirectory()) return callback(new Error('Unrecognized file.'));
        Step(function() {
            fs.readdir(filepath, this);
        },
        function(err, files) {
            if (err) throw err;
            if (files.length === 0) return this(null, []);
            var group = this.group();
            _(files).each(function(file) {
                rm(path.join(filepath, file), group());
            });
        },
        function(err) {
            if (err) return callback(err);
            fs.rmdir(filepath, callback);
        });
    });
};

// Load a single project model.
function loadProject(model, callback) {
    var modelPath = path.join(settings.files, 'project', model.id);
    var object;
    Step(function() {
        read(path.join(modelPath, model.id) + '.mml', this);
    },
    function(err, file) {
        if (err) throw new Error('Error reading model file.');

        // Set the object ID explicitly for multiple-load scenarios where
        // model parse()/set() is bypassed.
        object = JSON.parse(file.data);
        object.id = model.id;
        object._updated = Date.parse(file.mtime);
        if (object.Stylesheet && object.Stylesheet.length > 0) {
            var group = this.group();
            _(object.Stylesheet).each(function(filename) {
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

        object.Stylesheet = _(stylesheets).map(function(file) {
            return { id: file.basename, data: file.data };
        });
        this();
    },
    function(err) {
        if (err) throw err;

        // Determine if an SRS string should be migrated.
        var migrateSRS = function(srs) {
            var migrationCandidate = [
                '+a=6378137',
                '+b=6378137',
                '+k=1.0',
                '+lat_ts=0.0',
                '+lon_0=0.0',
                '+nadgrids=@null',
                '+proj=merc',
                '+units=m',
                '+x_0=0.0',
                '+y_0=0'];
            // Sort all proj arguments with equals signs (=) into an array.
            var components = _(srs.split(' ')).chain()
                .select(function(component) {
                    return (component.indexOf('=') !== -1);
                })
                .sortBy(function(component) { return component });
            return _.isEqual(components, migrationCandidate);
        }
        // Migrate legacy srs strings for 900913.
        var newSRS = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over';
        // Migrate project, layer SRS strings.
        var queue = [];
        object.srs && queue.push(object);
        object.Layer && (queue = queue.concat(object.Layer));
        _(queue).each(function(obj) {
            obj.srs = obj.srs && migrateSRS(obj.srs) && newSRS;
        });
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
        var files = [];
        if (data.id) delete data.id;
        if (data._updated) delete data._updated;
        if (data.Stylesheet) {
            data.Stylesheet = _(data.Stylesheet).map(function(s) {
                s.id && files.push(s);
                return s.id || s;
            });
        }
        files.push({
            id: model.id + '.mml',
            data: JSON.stringify(data, null, 2)
        });

        var group = this.group();
        _(files).each(function(file) {
            fs.writeFile(path.join(modelPath, file.id), file.data, group());
        });
    },
    function(err) {
        if (err) throw err;
        fs.stat(path.join(modelPath, model.id + '.mml'), this);
    },
    function(err, stat) {
        var attr = {};
        stat && (attr._updated = Date.parse(stat.mtime));
        callback(err, attr);
    });
}

// Export
// ------
// Implement custom sync method for Export model. Removes any files associated
// with the export model at `filename` when a model is destroyed.
var workers = [];
var pool = Pool({
    create: function(callback) {
        callback(null, new Worker(require.resolve('./export-worker.js')));
    },
    destroy: function(worker) {
        worker.terminate();
    },
    max: 3,
    idleTimeoutMillis: 5000
});

models.Export.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'delete':
        Step(function() {
            Backbone.sync('read', model, this, this);
        },
        function(data) {
            if (data && data.filename) {
                var filepath = path.join(settings.export_dir, data.filename);
                path.exists(filepath, function(exists) {
                    exists && fs.unlink(filepath, this) || this();
                }.bind(this));
            } else {
                this(false);
            }
        },
        function() {
            Backbone.sync(method, model, success, error);
        });
        break;
    case 'read':
        Backbone.sync('read', model, function(data) {
            if (data.status === 'processing' && !workers[model.id]) {
                data.status = 'error';
                data.error = 'Export did not complete.';
            }
            success(data);
        }, error);
        break;
    case 'create':
    case 'update':
        model.get('status') === 'waiting' && model.process();
        Backbone.sync(method, model, success, error);
        break;
    }
};

models.Export.prototype.process = function() {
    var model = this;
    var project = new models.Project({id: this.get('project')});
    project.fetch({success: function(project, resp) {
        pool.acquire(function(err, worker) {
            if (err) return callback(err);
            workers[model.id] = worker;
            worker.on('message', function(data) {
                if (data.event === 'complete') {
                    worker.removeAllListeners('message');
                    pool.release(worker);
                } else if (data.event === 'update') {
                    model.save(data.attributes);
                }
            });
            worker.postMessage(
                _(model.toJSON()).extend({datasource: project.toJSON()})
            );
        });
    }});
};
