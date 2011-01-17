/**
 * Server-side Backbone implementation for TileMill. This module should be
 * required instead of directly requiring Backbone.
 */
var _ = require('underscore')._,
    Backbone = require('./modules/backbone/backbone.js'),
    settings = require('./settings'),
    rmrf = require('./rm-rf'),
    fs = require('fs'),
    Step = require('step'),
    path = require('path');

/**
 * Override Backbone.sync() for the server-side context. Uses TileMill-specific
 * file storage methods for model CRUD operations.
 */
Backbone.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        if (model.id) {
            load(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        } else {
            loadAll(function(err, model) {
                return err ? error(err) : success(model);
            });
        }
        break;
    case 'create':
        create(model, function(err, model) {
            return err ? error(err) : success(model);
        });
        break;
    case 'update':
        update(model, function(err, model) {
            return err ? error(err) : success(model);
        });
        break;
    case 'delete':
        destroy(model, function(err, model) {
            return err ? error(err) : success(model);
        });
        break;
    }
};

/**
 * Load a single model. Requires that model.id be populated.
 */
function load(model, callback) {
    var projectPath = path.join(settings.files, 'project', model.id);
    fs.readFile(path.join(projectPath, model.id + '.mml'), 'utf-8',
    function(err, data) {
        if (err || !data || !JSON.parse(data)) {
            return callback(new Error('Error reading project file.'));
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
                            path.join(projectPath, filename),
                            'utf-8',
                            group()
                        );
                    });
                },
                function(err, files) {
                    _.each(object.Stylesheet, function(filename, index) {
                        if (typeof files[index] !== 'undefined') {
                            object.Stylesheet[index] = {
                                id: filename,
                                data: files[index]
                            };
                        }
                    });
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
function loadAll(callback) {
    var basepath = path.join(settings.files, 'project');
    Step(
        function() {
            path.exists(basepath, this);
        },
        function(exists) {
            if (!exists) {
                fs.mkdir(basepath, 0777, this);
            }
            else {
                this();
            }
        },
        function() {
            fs.readdir(basepath, this);
        },
        function(err, files) {
            if (err) {
                return this(new Error('Error reading projects directory.'));
            }
            else if (files.length === 0) {
                return this();
            }
            var group = this.group();
            for (var i = 0; i < files.length; i++) {
                load({id: files[i]}, group());
            }
        },
        function(err, projects) {
            return callback(err, projects);
        }
    );
};

/**
 * Create a new model.
 */
function create(model, callback) {
    // @TODO assign a model id if not present.
    save(model, callback);
};

/**
 * Update an existing model.
 */
function update(model, callback) {
    save(model, callback);
};

/**
 * Destroy (delete, remove, etc.) a model.
 */
function destroy(model, callback) {
    var projectPath = path.join(settings.files, 'project', model.id);
    rmrf(projectPath, function() {
        return callback(null, model);
    });
};

/**
 * Save a model. Called by create/update.
 */
function save(model, callback) {
    var projectPath = path.join(settings.files, 'project', model.id);
    Step(
        function() {
            rmrf(projectPath, this);
        },
        function() {
            fs.mkdir(projectPath, 0777, this);
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
                    path.join(projectPath, files[i].filename),
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

