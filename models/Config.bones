// Config
// ------
model = Backbone.Model.extend({});

model.prototype.schema = {
    'id': 'Config',
    'type': 'object',
    'properties': {
        'port': {
            'type': 'integer'
        },
        'files': {
            'type': 'string'
        },
        'httpProxy': {
            'type': 'string'
        },
        'verbose': {
            'type': 'string',
            'enum': ['on', 'off'],
        }
    }
};

model.prototype.initialize = function() {
    this.id = 'config';
};

model.prototype.url = function() {
    return '/api/Config/config';
};
