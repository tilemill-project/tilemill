// JSON schema environment.
var env;

Backbone.Model.prototype.validate = function(attr) {
    return this.validateAttributes(attr);
};

Backbone.Model.prototype.validateAttributes = function(attr) {
    if (!this.schema) return;

    if (!env) {
        if (Bones.server) JSV = require('JSV').JSV;
        env = JSV.createEnvironment('json-schema-draft-03');
        env.setOption('defaultSchemaURI', 'http://json-schema.org/hyper-schema#');
        env.setOption('latestJSONSchemaSchemaURI', 'http://json-schema.org/schema#');
        env.setOption('latestJSONSchemaHyperSchemaURI', 'http://json-schema.org/hyper-schema#');
        env.setOption('latestJSONSchemaLinksURI', 'http://json-schema.org/links#');
    }

    // Determine a Schema ID
    var schemaId = this.schema.id || this.constructor.title;

    // Load or create a schema instance that is used to validate the attributes.
    var schemaInstance = env.findSchema(schemaId) || env.createSchema(this.schema, undefined, schemaId)

    // We will validate against each of the property schemas individually.
    var properties = schemaInstance.getAttribute('properties');

    // TODO: this could be done more efficiently by breaking on the first error found,
    //       instead of discarding all the other errors later.
    return _(attr).chain()
        .map(function(v, k) {
            var err;
            if (!properties[k]) return;
            if (err = properties[k].validate(v).errors.pop()) {
                var prop = env.findSchema(err.schemaUri).getValue();
                if (prop.description) {
                    return new Error(prop.description);
                } else {
                    return new Error(err.message + ' (' + k + ')');
                }
            }
        })
        .compact()
        .last()
        .value();
};

model = Backbone.Model;
