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

// Retrieve "deep" attributes, e.g. deepGet('foo.bar')
Backbone.Model.prototype.deepGet = function(key) {
    var deepGet = function(attr, keys) {
        var key = keys.shift();
        if (keys.length) {
            return deepGet(attr[key] || {}, keys);
        } else {
            return attr[key];
        }
    }
    return deepGet(this.attributes, key.split('.'));
};

// Set "deep" attributes, e.g. deepSet('foo.bar', 5, {});
Backbone.Model.prototype.deepSet = function(key, val, options) {
    options = options || {};
    var deepSet = function(attr, keys, val) {
        var key = keys.shift();
        if (keys.length) {
            if (keys.length === 1 && !isNaN(parseInt(keys[0]))) {
                attr[key] = attr[key] || [];
            } else {
                attr[key] = attr[key] || {};
            }
            attr[key] = deepSet(attr[key], keys, val);
        } else {
            attr[key] = val;
        }
        return attr;
    }
    var root = key.split('.').shift();
    var attr = options.memo || {};
    attr[root] = attr[root] || _(this.attributes[root]).clone();
    attr = deepSet(attr, key.split('.'), val);

    // Let deepSet be used to generate a merged hash if desired.
    if (options.memo) {
        return attr;
    } else {
        return this.set(attr, options)
            .trigger('change', this)
            .trigger('change:' + root, this);
    }
};

model = Backbone.Model;
