// Stylesheet
// ----------
// Model. Represents a single map MSS stylesheet. This model is a child of
// the Project model and is saved serialized as part of the parent.
// **This model is not backed directly by the server.**
model = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true,
                'pattern': '^[A-Za-z0-9\-_.]+$',
                'title': 'Name',
                'description': 'Name may include alphanumeric characters, dots, dashes and underscores.'
            },
            'data': {
                'type': 'string',
                'required': true
            }
        }
    },
    defaults: {
        'data': ''
    }
});

