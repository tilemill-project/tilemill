/**
 * Server-side Backbone implementation for TileMill. This module should be
 * required instead of directly requiring Backbone.
 */
var _ = require('underscore')._,
    Backbone = require('./modules/backbone/backbone.js'),
    settings = require('./settings'),
    rmrf = require('./rm-rf'),
    fs = require('fs'),
    events = require('events'),
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
            load(model, success, error);
        } else {
            loadAll(success, error);
        }
        break;
    case 'create':
        create(model, success, error);
        break;
    case 'update':
        update(model, success, error);
        break;
    case 'delete':
        destroy(model, success, error);
        break;
    }
};

/**
 * Load a single model. Requires that model.id be populated.
 */
function load(model, success, error) {
    var projectPath = path.join(settings.files, 'project', model.id);
    fs.readFile(path.join(projectPath, model.id + '.mml'), 'utf-8',
    function(err, data) {
        if (err || !data) {
            return error(new Error('Error reading project file.'));
        }
        var object = JSON.parse(data);
        if (data && object) {
            // Set the object ID explicitly for multiple-load scenarios where
            // model parse()/set() is bypassed.
            object.id = model.id;
            if (object.Stylesheet && object.Stylesheet.length > 0) {
                var queue = new events.EventEmitter;
                var queueLength = object.Stylesheet.length;
                _.each(object.Stylesheet, function(filename, key) {
                    fs.readFile(path.join(projectPath, filename),
                    'utf-8',
                    function(err, data) {
                        object.Stylesheet[key] = {
                            id: filename,
                            data: data
                        };
                        queueLength--;
                        if (queueLength === 0) {
                            queue.emit('complete');
                        }
                    });
                });
                queue.on('complete', function() {
                    return success(object);
                });
            }
            else {
                return success(object);
            }
        }
        else {
            return error(new Error('Error parsing project JSON.'));
        }
    });
};

/**
 * Load an array of all models.
 */
function loadAll(success, error) {
    var loaded = [];
    var queue = new events.EventEmitter;
    var basepath = path.join(settings.files, 'project');
    path.exists(basepath, function(exists) {
        if (!exists) fs.mkdirSync(basepath, 0777);
        fs.readdir(basepath, function(err, files) {
            if (err) {
                return error(new Error('Error reading projects directory.'));
            }
            else if (files.length === 0) {
                return success(loaded);
            }
            var queueLength = files.length;
            for (var i = 0; i < files.length; i++) {
                load(
                    {id: files[i]},
                    function(model) {
                        loaded.push(model);
                        queueLength--;
                        if (queueLength === 0) {
                            queue.emit('complete');
                        }
                    },
                    function(err) {
                        queueLength--;
                        if (queueLength === 0) {
                            queue.emit('complete');
                        }
                    }
                );
            }
        });
    });
    queue.on('complete', function() {
        success(loaded);
    });
};

/**
 * Create a new model.
 */
function create(model, success, error) {
    // @TODO assign a model id if not present.
    save(model, success, error);
};

/**
 * Update an existing model.
 */
function update(model, success, error) {
    save(model, success, error);
};

/**
 * Destroy (delete, remove, etc.) a model.
 */
function destroy(model, success, error) {
    var projectPath = path.join(settings.files, 'project', model.id);
    rmrf(projectPath, function() {
        return success(model);
    });
};

/**
 * Save a model. Called by create/update.
 */
function save(model, success, error) {
    var projectPath = path.join(settings.files, 'project', model.id);

    rmrf(projectPath, function() {
        fs.mkdir(projectPath, 0777, function() {
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

            var queue = new events.EventEmitter;
            var queueLength = files.length;
            for (var i = 0; i < files.length; i++) {
                fs.writeFile(path.join(projectPath, files[i].filename),
                    files[i].data,
                    function(err) {
                    queueLength--;
                    if (queueLength === 0) {
                        queue.emit('complete');
                    }
                });
            }
            queue.on('complete', function() {
                success(model);
            });
        });
    });
}

module.exports = Backbone;

