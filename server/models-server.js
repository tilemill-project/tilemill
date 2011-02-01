var _ = require('underscore'),
    models = require('models'),
    modelCache = {};

module.exports = _.extend({
    cache: {
        get: function(type, id) {
            if (modelCache[type] && modelCache[type][id]) {
                return modelCache[type][id];
            }
            modelCache[type] = modelCache[type] || {}
            this.set(type, id, new models[type]({id: id}));
            return modelCache[type][id];
        },
        set: function(type, id, model) {
            modelCache[type] = modelCache[type] || {}
            modelCache[type][id] = model;
            return modelCache[type][id];
        },
        del: function(type, id) {
            if (modelCache[type][id]) {
                delete modelCache[type][id];
            }
        }
    }
}, models);
