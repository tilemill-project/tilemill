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
        }
    }
};

model.prototype.url = function() {
    return '/api/Favorite/' + encodeURIComponent(this.id);
};
