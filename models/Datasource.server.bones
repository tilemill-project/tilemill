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
    if (options.file) {
        options.file = options.file.trim().replace(/^~/, process.env.HOME);
    }

    millstone.resolve({
        mml: {
            Stylesheet: [{ id: 'layer', data: '' }],
            Layer: [{
                name: options.id,
                srs: options.srs || '',
                Datasource: options
            }]
        },
        base: path.join(config.files, 'project', options.project),
        cache: path.join(config.files, 'cache')
    }, function(err, mml) {
        if (err) {
            return error(err);
        }

        // "Sticky" options are those that should be passed to the layer model
        // when it saves the datasource in the mml that is later used for rendering
        // NOTE: 'row_limit' is not a sticky option intentially - it needs to get thrown away because we only
        // want to limit datasource queries for attribute data and not for rendering
        var sticky_options = {};

        try {
            mml.Layer[0].Datasource = _(mml.Layer[0].Datasource).defaults(options);

            // Some mapnik datasources accept 'row_limit` (like postgis, shape)
            // those that do not will be restricted during the featureset loop below
            var row_limit = 500;
            mml.Layer[0].Datasource = _(mml.Layer[0].Datasource).defaults({
                row_limit: row_limit
                });

            // Millstone used to set layer_by_index in all cases, but now we can do better
            // when saving.
            if (Object.keys(mml.Layer[0].Datasource).indexOf('layer_by_index') > -1) {
                delete mml.Layer[0].Datasource.layer_by_index;
            }

            // simplistic validation that subselects have the key_field string present
            // not a proper parser, but this is not the right place to be parsing SQL
            // https://github.com/tilemill-project/tilemill/issues/1509
            if (mml.Layer[0].Datasource.table !== undefined
                && mml.Layer[0].Datasource.key_field !== undefined
                && mml.Layer[0].Datasource.table.match(/select /i)
                && mml.Layer[0].Datasource.table.indexOf('*') == -1
                && mml.Layer[0].Datasource.table.search(mml.Layer[0].Datasource.key_field) == -1) {
                    return error(new Error("Your SQL subquery needs to explicitly include the custom key_field: '" + mml.Layer[0].Datasource.key_field + "' or use 'select *' to request all fields"));
            }

            var source;

            // https://github.com/tilemill-project/tilemill/issues/1754
            // https://github.com/tilemill-project/tilemill/issues/2210
            if (mml.Layer[0].Datasource.type == 'ogr') {
                try {
                    source = new mapnik.Datasource(mml.Layer[0].Datasource);
                } catch (err) {
                    if (err.message && err.message.indexOf('OGR Plugin: missing <layer>') != -1) {
                        var layers = err.message.split("are: ")[1];
                        var lsplit = layers.split('\',');
                        var layer_names = lsplit.map(function(w) { return w.trim().replace(/(^\')|(\'$)/g, "") });
                        if (layer_names.length > 1) {
                            // NOTE: this error message format must by sync'ed with
                            // code in views/Layer.bones which special cases handling it
                            throw new Error("This datasource has multiple layers: " + layer_names);
                        } else {
                            rethrow = false;
                            sticky_options.layer = layer_names[0];
                            mml.Layer[0].Datasource.layer = layer_names[0];
                            source = new mapnik.Datasource(mml.Layer[0].Datasource);
                        }
                    } else {
                        throw err;
                    }
                }
            } else {
                source = new mapnik.Datasource(mml.Layer[0].Datasource);
            }

            var features = [];
            if (!(source.type == "raster") && (options.features || options.info)) {
                var featureset = source.featureset();
                for (var i = 0, feat;
                    i < row_limit && (feat = featureset.next(true));
                    i++) {
                    features.push(feat.attributes());
                }
            }

            // Convert datasource extent to lon/lat when saving
            var layerProj = new mapnik.Projection(mml.Layer[0].srs),
                unProj = new mapnik.Projection('+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'),
                trans = new mapnik.ProjTransform(layerProj, unProj),
                unproj_extent = trans.forward(source.extent());
            // clamp to valid unproj_extents
            (unproj_extent[0] < -180) && (unproj_extent[0] = -180);
            (unproj_extent[1] < -85.051) && (unproj_extent[1] = -85.051);
            (unproj_extent[2] > 180) && (unproj_extent[2] = 180);
            (unproj_extent[3] > 85.051) && (unproj_extent[3] = 85.051);

            if (unproj_extent[2] < unproj_extent[0] || unproj_extent[3] < unproj_extent[1]) {
                throw new Error("Detected out of bounds geographic extent (" + unproj_extent + ") for layer '" + options.id + "'. Please ensure that the SRS for this layer is correct. Its native extent is '" + source.extent() + "'");
            }

            var desc = source.describe();
            var datasource = {
                id: options.id,
                project: options.project,
                url: options.file,
                fields: desc.fields,
                features: options.features ? features : [],
                type: desc.type,
                geometry_type: desc.type === 'raster' ? 'raster' : desc.geometry_type,
                unproj_extent: unproj_extent,
                sticky_options:sticky_options,
                extent: source.extent().join(',')
            };


            // Process fields and calculate min/max values.
            for (var f in datasource.fields) {
                var values = _(features).pluck(f);
                var type = datasource.fields[f];
                datasource.fields[f] = { type: type };
                if (options.features || options.info) {
                    datasource.fields[f].max = type === 'String'
                        ? (function() {
                            var val = _(values).max(function(v) { return (v||'').length });
                            return (val && val.length > 55) ?
                              val.slice(0, 55 - 3) + '...' : val;
                        })()
                        : _(values).max();
                    datasource.fields[f].min = type === 'String'
                        ? _(values).min(function(v) { return (v||'').length })
                        : _(values).min();
                }
            }
        } catch(err) {
            return error(err);
        }

        success(datasource);
    });
};
