// Export
// ------
// Model. Describes a single export task, e.g. rendering a map to a PDF.
model = Backbone.Model.extend({});

model.prototype.schema = {
    'id': 'Export',
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
            'items': [
                { 'type':'number', 'minimum': -180, 'maximum':180 },
                { 'type':'number', 'minimum': -85.05112877980659, 'maximum': 85.05112877980659 },
                { 'type':'number', 'minimum': -180, 'maximum':180 },
                { 'type':'number', 'minimum': -85.05112877980659, 'maximum': 85.05112877980659 }
            ]
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
            'enum': ['png', 'pdf', 'svg', 'mbtiles', 'upload', 'sync']
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
        'name': {
            'type': 'string'
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
    if (this.isNew()) this.set({
        id: Date.now().toString()
    }, {silent: true});
};

model.prototype.url = function() {
    return '/api/Export/' + this.id;
};

model.prototype.defaults = {
    progress: 0,
    status: 'waiting'
};

// Adds:
// - bbox checking... we don't currently support crossing the dateline.
model.prototype.validate = function(attr) {
    var error = this.validateAttributes(attr);
    if (error) return error;

    if (attr.bbox && attr.bbox[0] >= attr.bbox[2])
        return new Error('Bounds W must be less than E.');
    if (attr.bbox && attr.bbox[1] >= attr.bbox[3])
        return new Error('Bounds S must be less than N.');
};

