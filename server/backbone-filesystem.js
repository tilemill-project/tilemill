var _ = require('underscore')._,
    Backbone = require('../modules/backbone/backbone.js'),
    settings = require('settings'),
    path = require('path'),
    dirty = require('node-dirty')(path.join(settings.files, 'app.db'));

/**
 * Override Backbone.sync() for the server-side context.
 * Uses node-dirty for model persistence.
 */
Backbone.sync = function(method, model, success, error) {
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
            dirty.forEach(function(key, val) {
                if (model.type === key.split(':')[0] && val && data.indexOf(val) === -1) {
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

module.exports = Backbone;

