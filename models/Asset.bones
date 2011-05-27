// Asset
// -----
// Model. Single external asset, e.g. a shapefile, image, etc.
model = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true
            },
            'url': {
                'type': 'string',
                'required': true
            },
            'bytes': {
                'type': 'string'
            }
        }
    },
    extension: function() {
        return this.id.split('.').pop();
    }
});

