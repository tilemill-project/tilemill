// Export
// ------
// Model. Describes a single export task, e.g. rendering a map to a PDF.
model = Backbone.Model.extend({});

model.prototype.schema = {
    'type': 'object',
    'properties': {
        'id': {
            'type': 'string',
            'required': true
        },
        'bbox': {
            'type': 'array',
            'minItems': 4,
            'maxItems': 4,
            'items': {
                'type': 'number'
            }
        },
        'width': {
            'type': 'integer'
        },
        'height': {
            'type': 'integer'
        },
        'project': {
            'type': 'string',
            'required': true
        },
        'format': {
            'type': 'string',
            'required': true,
            'enum': ['png', 'pdf', 'mbtiles']
        },
        'status': {
            'type': 'string',
            'required': true,
            'enum': ['waiting', 'processing', 'complete', 'error']
        },
        'progress': {
            'type': 'number',
            'minimum': 0,
            'maximum': 1
        },
        'filename': {
            'type': 'string',
            'pattern': '^[A-Za-z0-9\-_.]+$'
        },
        'created': {
            'type': 'integer'
        },
        'updated': {
            'type': 'integer'
        },
        'error': {
            'type': 'string'
        }
    }
};

model.prototype.initialize = function() {
    if (this.isNew()){
        this.set({
            created: +new Date,
            id: (+new Date) + ''
        }, {silent: true});
    }
};

model.prototype.url = function() {
    return '/api/Export/' + this.id;
};

model.prototype.defaults = {
    progress: 0,
    status: 'waiting'
};

