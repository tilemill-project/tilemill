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

    var properties = ((this.schema.id
        && env.findSchema(this.schema.id)
        || env.createSchema(this.schema, undefined, this.schema.id))
        || env.createSchema(this.schema))
        .getAttribute('properties');

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
