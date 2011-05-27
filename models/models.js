//// JSON schema validation
//// ----------------------
//// Provide a default `validate()` method for all models. If a `schema` property
//// is defined on a model, use JSON-schema validation by default.
//Backbone.Model.prototype.validate = function(attributes) {
//    if (!this.schema || !this.schema.properties) return;
//    var env = JSV.createEnvironment();
//    for (var key in attributes) {
//        if (this.schema.properties[key]) {
//            var property = this.schema.properties[key],
//                value = attributes[key];
//            // Do a custom check for required properties, (e.g. do not allow
//            // an empty string to validate against a required property.)
//            if (!value && property.required) {
//                return (property.title || key) + ' is required.';
//            }

//            var errors = env.validate(value, property).errors;
//            if (errors.length) {
//                var error = errors.pop();
//                if (property.description) {
//                    return property.description;
//                } else {
//                    return (property.title || key) + ': ' + error.message;
//                }
//            }
//        }
//    }
//};

//// Abilities (read-only)
//// ---------------------
//// Model. Describes server API abilities.
//var Abilities = Backbone.Model.extend({
//    schema: {
//        'type': 'object',
//        'properties': {
//            'fonts': {
//                'type': 'array',
//                'title': 'Fonts',
//                'description': 'Fonts available to Mapnik.'
//            },
//            'datasources': {
//                'type': 'array',
//                'title': 'Datasources',
//                'description': 'Datasource types available to Mapnik.'
//            },
//            'exports': {
//                'type': 'object',
//                'title': 'Exports',
//                'description': 'Export types available to Mapnik.'
//            }
//        }
//    },
//    url: 'api/Abilities'
//});

//// Reference (read-only)
//// ---------------------
//// Model. MSS syntax reference.
//var Reference = Backbone.Model.extend({
//    url: 'api/Reference'
//});

//// Settings
//// --------
//// Model. Stores any user-specific configuration related to the app.
//var Settings = Backbone.Model.extend({
//    schema: {
//        'type': 'object',
//        'properties': {
//            'id': {
//                'type': 'string',
//                'required': true,
//                'enum': ['settings']
//            },
//            'mode': {
//                'type': 'string',
//                'enum': ['normal', 'minimal'],
//                'title': 'Editing mode',
//                'description': 'Editing mode may be \'normal\' or \'minimal\' to allow use of external editors.'
//            }
//        }
//    },
//    url: function() {
//        return 'api/Settings/' + this.id;
//    }
//});

