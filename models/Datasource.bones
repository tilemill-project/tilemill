// Datasource (read-only)
// ----------------------
// Model. Inspection metadata about a map layer. Use `fetchFeatures()` to do
// a datasource fetch that includes layer feature objects.
model = Backbone.Model.extend({
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes) {
        this.set({'fields': attributes.fields});
    },
    url: function() {
        var url = 'api/Datasource';
        this.getFeatures && (url += '/features');
        if (typeof module === 'undefined') {
            url += '?' + $.param(this.attributes);
        }
        return url;
    },
    fetchFeatures: function(options) {
        this.getFeatures = true;
        this.fetch(options);
    }
});

/*
// FileDatasource (read-only)
// --------------------------
// Model. Inspection metadata about a map layer. Use `fetchFeatures()` to do
// a datasource fetch that includes layer feature objects.
var FileDatasource = Datasource.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
            },
            'project': {
                'required': true,
                'type': 'string',
                'description': 'Project to which this datasource belongs.'
            },
            'url': {
                'type': 'string',
                'required': true,
                'minLength': 1,
                'title': 'URL',
                'description': 'URL of the datasource.'
            },
            'fields': {
                'type': 'object'
            },
            'features': {
                'type': 'array'
            },
            'ds_options': {
                'type': 'object'
            },
            'ds_type': {
                'type': 'string'
            },
            'geometry_type': {
                'type': 'string',
                'enum': ['polygon', 'point', 'linestring', 'raster', 'unknown']
            }
        }
    }
});

// PostgisDatasource (read-only)
// -----------------------------
// Model. Inspection metadata about a map layer. Use `fetchFeatures()` to do
// a datasource fetch that includes layer feature objects.
var PostgisDatasource = Datasource.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
            },
            'project': {
                'required': true,
                'type': 'string',
                'description': 'Project to which this datasource belongs.'
            },
            'dbname': {
                'type': 'string',
                'required': true,
                'minLength': 1,
                'title': 'Database',
                'description': 'Invalid PostGIS database.'
            },
            'table': {
                'type': 'string',
                'required': true,
                'minLength': 1,
                'title': 'Query',
                'description': 'Invalid PostGIS query.'
            },
            'fields': {
                'type': 'object'
            },
            'features': {
                'type': 'array'
            },
            'ds_options': {
                'type': 'object'
            },
            'ds_type': {
                'type': 'string'
            },
            'geometry_type': {
                'type': 'string',
                'enum': ['polygon', 'point', 'linestring', 'raster', 'unknown']
            }
        }
    }
});
*/
