// Cache
// -----
// Provides a model instance cache for the server. Used to store and retrieve a
// model instance in memory such that the same model is referenced in separate
// requests as well as in other long-running processes.
//
// The main use-case in TileMill for this instance cache is triggering a model
// `delete` event when a DELETE request is received. In the case of Exports,
// this event is used to terminate and worker processes associated with the
// Export model being deleted.
var models = require('models');
module.exports = {
    cache: {},
    get: function(type, id) {
        if (this.cache[type] && this.cache[type][id]) {
            return this.cache[type][id];
        }
        this.cache[type] = this.cache[type] || {}
        this.set(type, id, new models[type]({id: id}));
        return this.cache[type][id];
    },
    set: function(type, id, model) {
        this.cache[type] = this.cache[type] || {}
        this.cache[type][id] = model;
        return this.cache[type][id];
    },
    del: function(type, id) {
        if (this.cache[type][id]) {
            delete this.cache[type][id];
        }
    }
};

