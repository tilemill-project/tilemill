// Config
// ------
model = Backbone.Model.extend({});

model.prototype.schema = {
    'type': 'object',
    'properties': {
        'port': {
            'type': 'integer'
        },
        'bufferSize': {
            'type': 'integer'
        },
        'files': {
            'type': 'string'
        }
    }
};

model.prototype.initialize = function() {
    this.id = 'config';
};

model.prototype.url = function() {
    return '/api/Config/config';
};
