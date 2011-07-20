var path = require('path');
var fs = require('fs');
var mapnik = require('tilelive-mapnik/node_modules/mapnik');
var Map = require('tilelive-mapnik').Map;
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
                file: options.url,
                type: options.ds_type
            }).extend(options),
            srs: SRS
        }]
    };
    var env = {
        data_dir: path.join(config.files, 'project', options.project),
        local_data_dir: path.join(config.files, 'project', options.project)
    };
    var map = new Map(mml, env);
    var datasource;

    Step(function() {
        map.initialize(this);
    },
    function(err) {
        if (err) return error(err);

        var ds = map.mapnik.describe_data()[options.id];
        datasource = {
            id: options.id,
            project: options.project,
            url: options.url,
            fields: ds.fields,
            features: options.features ? map.mapnik.features(0, 1000) : [],
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

        map.destroy();
        success(datasource);
    });
};

