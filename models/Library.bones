// Library
// --------
// Model. Stores settings for a given asset library type, e.g. a local file
// directory or an Amazon S3 bucket.
model = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'id': {
                'type': 'string',
                'required': true,
                'minLength': 1
            },
            'type': {
                'type': 'string',
                'required': true,
                'enum': ['s3', 'directory']
            },
            'name': {
                'type': 'string',
                'required': true,
                'minLength': 1
            },
            's3_bucket': {
                'type': 'string',
                'required': true,
                'minLength': 1
            },
            'directory_path': {
                'type': 'string',
                'required': true,
                'minLength': 1
            }
        },
        'dependencies': {
            's3_bucket': {
                'properties': {
                    'type': { 'enum': ['s3'], 'required': true }
                }
            },
            's3_key': {
                'properties': {
                    'type': { 'enum': ['s3'], 'required': true }
                }
            },
            's3_secret': {
                'properties': {
                    'type': { 'enum': ['s3'], 'required': true }
                }
            },
            'directory_path': {
                'properties': {
                    'type': { 'enum': ['directory'], 'required': true }
                }
            }
        }
    },
    url: function() {
        return 'api/Library/' + this.id;
    },
    defaults: {
        type: 'directory'
    },
    initialize: function(options) {
        if (this.isNew()){
            this.set({id: (+new Date) + ''}, {silent: true});
        }
        switch (this.get('type')) {
        case 's3':
            this.assets = new models.AssetsS3({ library: this });
            break;
        default:
            this.assets = new models.Assets({ library: this });
            break;
        }
    }
});

