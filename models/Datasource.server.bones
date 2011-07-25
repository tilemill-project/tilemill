var path = require('path');
var url = require('url');
var fs = require('fs');
var tilelive = require('tilelive');
var Step = require('step');

// @TODO this is rather messy atm - it caches the datasource to
// `files/project/[id]` but in the process also writes a hash-name
// map to `/files/project/102579sdjkvxcoi8a.xml` (or so) as part of
// `map.initialize()`. After initialization
models.Datasource.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error('Method not supported.');

    var options = model.options;
    var config = Bones.plugin.config;

    if (!options) return error(new Error('options are required.'));
    if (!options.id) return error(new Error('id is required.'));
    if (!options.project) return error(new Error('project is required.'));

    var SRS = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over';
    var mml = {
        srs: SRS,
        Stylesheet: [{id:'layer',data:''}],
        Layer: [{
            name: options.id,
            Datasource: _({
                file: options.file,
                type: options.ds_type
            }).extend(options),
            srs: SRS
        }]
    };

    // We abuse tilelive-mapnik and use a faked MML object to localize data
    // into the project directory.
    var id = options.project;
    var uri = {
        protocol: 'mapnik:',
        slashes: true,
        pathname: path.join(config.files, 'project', id, id + '.mml'),
        query: {
            // Note: file is only used to force a different cache key.
            file: options.file + (+ new Date()),
            base: path.join(config.files, 'project', options.project),
            cache: path.join(config.files, 'cache')
        },
        data: mml
    };

    tilelive.load(uri, function(err, source) {
        if (err) return error(err);

        // @TODO: We're accessing the internals of tilelive-mapnik.
        // This may or may not be a good idea.
        source._pool.acquire(function(err, map) {
            if (err) return error(err);

            var ds = map.describe_data()[options.id];
            var datasource = {
                id: options.id,
                project: options.project,
                url: options.file,
                fields: ds.fields,
                features: options.features ? map.features(0, 1000) : [],
                type: ds.type,
                geometry_type: ds.type === 'raster' ? 'raster' : ds.geometry_type
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

            source._pool.release(map);
            success(datasource);
        });
    });
};

