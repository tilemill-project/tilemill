// Favorite
// --------
// Model. A URI favorite.
model = Backbone.Model.extend();

model.prototype.schema = {
    'id': 'Favorite',
    'type': 'object',
    'properties': {
        'id': {
            'type': 'string',
            'required': true
        },
        'created': {
            'type': 'integer'
        }
    }
};

model.prototype.url = function() {
    return '/api/Favorite/' + encodeURIComponent(this.id);
};
