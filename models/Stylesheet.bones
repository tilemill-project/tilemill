// Stylesheet
// ----------
// Model. Represents a single map MSS stylesheet. This model is a child of
// the Project model and is saved serialized as part of the parent.
// **This model is not backed directly by the server.**
model = Backbone.Model.extend({});

model.prototype.schema = {
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
};

model.prototype.defaults = { 'data': '' };

model.prototype.validate = function(attr) {
    if (attr.id &&
        this.collection &&
        this.collection.get(attr.id) &&
        this.collection.get(attr.id) !== this)
            return new Error(_('Stylesheet "<%=id%>" already exists.').template(attr));
};
