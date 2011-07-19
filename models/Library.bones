// Library
// --------
// Model. Stores settings for a given asset library type, e.g. a local file
// directory or an Amazon S3 bucket.
model = Backbone.Model.extend();

model.prototype.schema = {
    'type': 'object',
    'properties': {
        'id': {
            'type': 'string',
            'required': true
        },
        'location': {
            'type': 'string',
            'description': 'Current working dir or URL location.'
        },
        'assets': {
            'type': 'array',
            'description': 'Objects in this library.',
            'items': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string',
                        'description': 'Human readable name of this asset.'
                    },
                    'location': {
                        'type': 'string',
                        'description': 'Asset changes the Library\'s location.'
                    },
                    'uri': {
                        'type': 'string',
                        'description': 'URI of this asset.'
                    }
                }
            }
        }
    }
};

model.prototype.url = function() {
    var url = 'api/Library/' + this.id;
    if (!Bones.server && this.get('location')) {
        url += '?' + $.param({location:this.get('location')});
    }
    return url;
};

model.prototype.initialize = function(attributes, options) {
    options = options || {};
    if (options.location) this.set({'location': options.location});
};

