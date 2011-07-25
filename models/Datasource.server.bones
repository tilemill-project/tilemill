var path = require('path');
var url = require('url');
var fs = require('fs');
var mapnik = require('mapnik');
var Step = require('step');
var millstone = require('millstone');

models.Datasource.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error('Method not supported.');

    var options = model.options;
    var config = Bones.plugin.config;

    if (!options) return error(new Error('options are required.'));
    if (!options.id) return error(new Error('id is required.'));
    if (!options.project) return error(new Error('project is required.'));

    millstone({
        mml: {
            Stylesheet: [{ id: 'layer', data: '' }],
            Layer: [{
                name: options.id,
                Datasource: {
                    file: options.file,
                    type: options.type
                }
            }]
        },
        base: path.join(config.files, 'project', options.project),
        cache: path.join(config.files, 'cache')
    }, function(err, mml) {
        if (err) return error(err);

        var source = new mapnik.Datasource(_({
            file: mml.Layer[0].Datasource.file,
            type: mml.Layer[0].Datasource.type
        }).defaults(options));

        var features = [];
        if (options.features) {
            var featureset = source.featureset();
            for (var i = 0, feat; i < 1000 && (feat = featureset.next(true)); i++) {
                features.push(feat.attributes());
            }
        }

        var desc = source.describe();
        var datasource = {
            id: options.id,
            project: options.project,
            url: options.file,
            fields: desc.fields,
            features: features,
            type: desc.type,
            geometry_type: desc.type === 'raster' ? 'raster' : desc.geometry_type
        };

        // Process fields and calculate min/max values.
        for (var f in datasource.fields) {
            datasource.fields[f] = {
                type: datasource.fields[f],
                max: _(datasource.features).chain().pluck(f)
                    .max(function(v) {
                        return _(v).isString() ? v.length : v;
                    }).value(),
                min: _(datasource.features).chain().pluck(f)
                    .min(function(v) {
                        return _(v).isString() ? v.length : v;
                    }).value()
            };
        }

        success(datasource);
    });
};
