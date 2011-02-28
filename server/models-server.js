// Server-side overrides for the Backbone models defined in `shared/models.js`.
// Provides model-specific storage overrides.
var _ = require('underscore')._,
    Backbone = require('backbone'),
    settings = require('settings'),
    fs = require('fs'),
    Step = require('step'),
    path = require('path'),
    models = require('models');

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
            // Loading a project model is not trivial in cost like backbone
            // dirty models. We set a flag to indicate that this project has
            // been fetched for any callers who might want to reduce the
            // number of fetch calls made if possible.
            model._fetched = true;
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
    fs.readFile(path.join(modelPath, model.id) + '.mml', 'utf-8',
    function(err, data) {
        if (err || !data) {
            return callback('Error reading model file.');
        }
        var object = JSON.parse(data);
        // Set the object ID explicitly for multiple-load scenarios where
        // model parse()/set() is bypassed.
        object.id = model.id;
        if (object.Stylesheet && object.Stylesheet.length > 0) {
            Step(
                function() {
                    var group = this.group();
                    _.each(object.Stylesheet, function(filename, index) {
                        fs.readFile(
                            path.join(modelPath, filename),
                            'utf-8',
                            group()
                        );
                    });
                },
                function(err, files) {
                    object.Stylesheet = _.reduce(
                        object.Stylesheet,
                        function(memo, filename, index) {
                            if (typeof files[index] !== 'undefined') {
                                memo.push({
                                    id: filename,
                                    data: files[index]
                                });
                            }
                            return memo;
                        },
                        []
                    );
                    return callback(null, object);
                }
            );
        } else {
            return callback(null, object);
        }
    });
};

// Load all projects into an array.
function loadProjectAll(model, callback) {
    var basepath = path.join(settings.files, 'project');
    Step(
        function() {
            path.exists(basepath, this);
        },
        function(exists) {
            if (!exists) {
                fs.mkdir(basepath, 0777, this);
            } else {
                this();
            }
        },
        function() {
            fs.readdir(basepath, this);
        },
        function(err, files) {
            if (err) {
                return this('Error reading model directory.');
            }
            else if (files.length === 0) {
                return this();
            }
            var group = this.group();
            for (var i = 0; i < files.length; i++) {
                var id = files[i];
                loadProject({ id: id }, group());
            }
        },
        function(err, models) {
            // Ignore errors from loading individual models (e.g.
            // don't let one bad apple spoil the collection).
            models = _.select(models, function(model) {
                return (typeof model === 'object');
            });
            return callback(null, models);
        }
    );
};

// Destroy a project. `rm -rf` equivalent for the project directory.
function destroyProject(model, callback) {
    var rm = function(basePath, callback) {
        var killswitch = false;
        Step(
            function() {
                fs.stat(basePath, this);
            },
            function(err, stat) {
                if (stat.isDirectory()) {
                    this();
                } else if (stat.isFile()) {
                    killswitch = true;
                    fs.unlink(basePath, this);
                } else {
                    killswitch = true;
                    this();
                }
            },
            // The next steps apply only when basePath refers to a directory.
            function(err) {
                if (killswitch) return this();
                fs.readdir(basePath, this);
            },
            function(err, files) {
                if (killswitch) return this();
                if (files.length === 0) {
                    this();
                } else {
                    var group = this.group();
                    for (var i = 0; i < files.length; i++) {
                        rm(path.join(basePath, files[i]), group());
                    }
                }
            },
            function(err) {
                if (killswitch) return callback();
                fs.rmdir(basePath, callback);
            }
        );
    };
    var modelPath = path.join(settings.files, 'project', model.id);
    rm(modelPath, callback);
}

// Save a project. Creates a subdirectory per project and splits out
// stylesheets into separate files.
function saveProject(model, callback) {
    var basePath = path.join(settings.files, 'project');
    var modelPath = path.join(settings.files, 'project', model.id);
    Step(
        function() {
            path.exists(basePath, this);
        },
        function(exists) {
            if (!exists) {
                fs.mkdir(basePath, 0777, this);
            } else {
                this();
            }
        },
        function() {
            path.exists(modelPath, this);
        },
        function(exists) {
            if (!exists) {
                fs.mkdir(modelPath, 0777, this);
            } else {
                this();
            }
        },
        function() {
            fs.readdir(modelPath, this);
        },
        function(err, files) {
            // Remove any stale files in the project directory.
            var group = this.group();
            var stylesheets = model.get('Stylesheet') || [];
            var stale = _.select(files, function(filename) {
                if (filename === (model.id + '.mml')) {
                    return false;
                } else if (_.pluck(stylesheets, 'id').indexOf(filename) !== -1) {
                    return false;
                }
                return true;
            });
            if (stale.length) {
                for (var i = 0; i < stale.length; i++) {
                    fs.unlink(path.join(modelPath, stale[i]), group());
                }
            }
            else {
                group()();
            }
        },
        function() {
            // Hard clone the model JSON before doing adjustments to the data
            // based on writing separate stylesheets.
            var data = JSON.parse(JSON.stringify(model.toJSON()));
            var files = [];
            if (data.id) {
                delete data.id;
            }
            if (data.Stylesheet) {
                _.each(data.Stylesheet, function(stylesheet, key) {
                    if (stylesheet.id) {
                        files.push({
                            filename: stylesheet.id,
                            data: stylesheet.data
                        });
                        data.Stylesheet[key] = stylesheet.id;
                    }
                });
            }
            files.push({
                filename: model.id + '.mml',
                data: JSON.stringify(data)
            });

            var group = this.group();
            for (var i = 0; i < files.length; i++) {
                fs.writeFile(
                    path.join(modelPath, files[i].filename),
                    files[i].data,
                    group()
                );
            }
        },
        function() {
            callback(null, model);
        }
    );
}

// Export
// ------
// Implement custom sync method for Export model. Removes any files associated
// with the export model at `filename` when a model is destroyed.
models.Export.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'delete':
        var filepath;
        Step(
            function() {
                Backbone.sync('read', model, this, this);
            },
            function(data) {
                if (data && data.filename) {
                    filepath = path.join(settings.export_dir, data.filename);
                    path.exists(filepath, this);
                } else {
                    this(false);
                }
            },
            function(remove) {
                if (remove) {
                    fs.unlink(filepath, this);
                } else {
                    this();
                }
            },
            function() {
                Backbone.sync(method, model, success, error);
            }
        );
        break;
    default:
        Backbone.sync(method, model, success, error);
        break;
    }
};
