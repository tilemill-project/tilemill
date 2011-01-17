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
            loadAll(model, function(err, model) {
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
    var modelPath = path.join(settings.files, model.type, model.id);
    var extension = 'json';
    if (model.type == 'project') {
        extension = 'mml';
    }
    fs.readFile(path.join(modelPath, model.id + '.' + extension), 'utf-8',
    function(err, data) {
        if (err || !data || !JSON.parse(data)) {
            return callback(new Error('Error reading model file.'));
        }
        var object = JSON.parse(data);
        // Set the object ID explicitly for multiple-load scenarios where
        // model parse()/set() is bypassed.
        object.id = model.id;
        if (model.type == 'project' && object.Stylesheet && object.Stylesheet.length > 0) {
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
                    _.each(object.Stylesheet, function(filename, index) {
                        if (files[index]) {
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
function loadAll(model, callback) {
    var basepath = path.join(settings.files, model.type);
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
                return this(new Error('Error reading model directory.'));
            }
            else if (files.length === 0) {
                return this();
            }
            var group = this.group();
            for (var i = 0; i < files.length; i++) {
                load({id: files[i], type: model.type}, group());
            }
        },
        function(err, models) {
            return callback(err, models);
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
    var modelPath = path.join(settings.files, model.type, model.id);
    rmrf(modelPath, function() {
        return callback(null, model);
    });
};

/**
 * Save a model. Called by create/update.
 */
function save(model, callback) {
    var modelPath = path.join(settings.files, model.type, model.id);
    Step(
        function() {
            rmrf(modelPath, this);
        },
        function() {
            fs.mkdir(modelPath, 0777, this);
        },
        function() {
            if (model.type == 'project') {
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
            }
            else {
                fs.writeFile(
                    path.join(modelPath, model.id + '.json'),
                    JSON.stringify(model.toJSON()),
                    this
                );
            }
        },
        function() {
            callback(null, model);
        }
    );
}

module.exports = Backbone;

