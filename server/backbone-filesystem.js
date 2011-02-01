/**
 * Server-side Backbone implementation for TileMill. This module should be
 * required instead of directly requiring Backbone.
 */
var _ = require('underscore')._,
    Backbone = require('../modules/backbone/backbone.js'),
    settings = require('settings'),
    rmrf = require('rm-rf'),
    fs = require('fs'),
    Step = require('step'),
    path = require('path'),
    dirty = require('node-dirty')(path.join(settings.files, 'app.db'));

/**
 * Override Backbone.sync() for the server-side context. Uses TileMill-specific
 * file storage methods for model CRUD operations.
 */
Backbone.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        if (model.type === 'project') {
            if (model.id) {
                load(model, function(err, model) {
                    return err ? error(err) : success(model);
                });
            } else {
                loadAll(model, function(err, model) {
                    return err ? error(err) : success(model);
                });
            }
        } else {
            if (model.id) {
                var data = dirty.get(model.type + ':' + model.id);
                if (data) {
                    success(data);
                } else {
                    error('Model not found.');
                }
            } else {
                var data = [];
                dirty.forEach(function(key, val) {
                    if (model.type === key.split(':')[0] && val && data.indexOf(val) === -1) {
                        data.push(val);
                    }
                });
                success(data);
            }
        }
        break;
    case 'create':
    case 'update':
        if (model.type === 'project') {
            saveProject(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        } else {
            dirty.set(
                model.type + ':' + model.id,
                model.toJSON(),
                function(err, model) {
                    return err ? error(err) : success(model);
                }
            );
        }
        break;
    case 'delete':
        if (model.type === 'project') {
            destroyProject(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        } else if (model.type === 'export') {
            destroyExport(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        } else {
            dirty.rm(
                model.type + ':' + model.id,
                function(err, model) {
                    return err ? error(err) : success(model);
                }
            );
        }
        break;
    }
};

/**
 * Load a single model. Requires that model.id be populated.
 */
function load(model, callback) {
    var modelPath = path.join(settings.files, model.type);
    modelPath = (model.type == 'project') ? path.join(modelPath, model.id) : modelPath;
    var extension = (model.type == 'project') ? 'mml' : 'json';
    fs.readFile(path.join(modelPath, model.id + '.' + extension), 'utf-8',
    function(err, data) {
        if (err || !data) {
            return callback('Error reading model file.');
        }
        var object = JSON.parse(data);
        // Set the object ID explicitly for multiple-load scenarios where
        // model parse()/set() is bypassed.
        object.id = model.id;
        if (model.type === 'project' && object.Stylesheet && object.Stylesheet.length > 0) {
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
        }
        else {
            return callback(null, object);
        }
    });
};

/**
 * Load an array of all models.
 */
function loadAll(model, callback) {
    var basepath = path.join(settings.files, model.type);
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
                if (model.type === 'project') {
                    var id = files[i];
                } else {
                    var id = path.basename(files[i], '.json');
                }
                load({ id: id, type: model.type }, group());
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

/**
 * Destroy a project.
 * rm rf the project directory.
 */
function destroyProject(model, callback) {
    var modelPath = path.join(settings.files, model.type, model.id);
    rmrf(modelPath, function() { return callback(null, model) });
}

/**
 * Destroy an export.
 * remove the export file and remove its node-dirty entry.
 */
function destroyExport(model, callback) {
    var filepath;
    Step(
        function() {
            load(model, this);
        },
        function(err, data) {
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
            dirty.rm(
                model.type + ':' + model.id,
                function() { callback(null, model) }
            );
        }
    );
}

/**
 * Save a Project. Called by create/update.
 *
 * Special case for projects creates a subdirectory per project and does
 * additional splitting out of subproperties (stylesheets) into separate files.
 */
function saveProject(model, callback) {
    var basePath = path.join(settings.files, model.type);
    var modelPath = path.join(settings.files, model.type, model.id);
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

module.exports = Backbone;

