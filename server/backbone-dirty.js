var Backbone = require('../modules/backbone/backbone.js'),
    settings = require('settings'),
    path = require('path'),
    dirty = require('node-dirty')(path.join(settings.files, 'app.db')),
    loaded = false;

// Backbone (server-side with node-dirty)
// --------------------------------------
// Exports Backbone with `Backbone.sync()` overridden for the server-side
// context. Uses `node-dirty` for model persistence. Models must have a `type`
// property defined allowing type based collections to be fetched from the
// `node-dirty` database.
Backbone.sync = function(method, model, success, error) {
    var sync = function(method, model, success, error) {
        switch (method) {
        case 'read':
            if (model.id) {
                var data = dirty.get(model.type + ':' + model.id);
                if (data) {
                    success(data);
                } else {
                    error('Model not found.');
                }
            } else {
                var data = [];
                var type = model.type;
                if (model.model) {
                    type = model.model.prototype.type;
                }
                dirty.forEach(function(key, val) {
                    if (type === key.split(':')[0] && val && data.indexOf(val) === -1) {
                        data.push(val);
                    }
                });
                success(data);
            }
            break;
        case 'create':
        case 'update':
            dirty.set(
                model.type + ':' + model.id,
                model.toJSON(),
                function(err, model) {
                    return err ? error(err) : success(model);
                }
            );
            break;
        case 'delete':
            dirty.rm(
                model.type + ':' + model.id,
                function(err, model) {
                    return err ? error(err) : success(model);
                }
            );
            break;
        }
    };

    // The inner `sync()` function allows the actual operation to be deferred
    // until the database has been fully loaded.
    if (loaded) {
        sync(method, model, success, error);
    } else {
        dirty.on('load', function() {
            sync(method, model, success, error);
        });
    }
};

// Set a loaded flag to indicate whether `Backbone.sync()` can begin accessing
// the db immediately or must wait until the `load` event is emitted.
dirty.on('load', function() {
    loaded = true;
});

module.exports = Backbone;

