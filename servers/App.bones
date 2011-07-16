var mapnik = require('tilelive-mapnik/node_modules/mapnik'),
    Map = require('tilelive-mapnik').Map,
    path = require('path'),
    env = process.env.NODE_ENV || 'development';
var abilities = {
    carto: require('tilelive-mapnik/node_modules/carto').tree.Reference.data,
    fonts: mapnik.fonts(),
    datasources: mapnik.datasources(),
    exports: {
        mbtiles: true,
        png: true,
        pdf: mapnik.supports.cairo
    }
};

server = Bones.Server.extend({});

server.prototype.initialize = function(app) {
    this.config = app.config;
    _(this).bindAll('index', 'abilities', 'describeDatasource');
    this.get('/', this.index);
    this.get('/assets/tilemill/js/abilities.js', this.abilities);
    this.get('/api/Datasource/:option?', this.describeDatasource);

    // Add static provider to download exports.
    this.use('/export/download', middleware['static'](
        this.config['export'],
        { maxAge: env === 'production' ? 3600000 : 0 } // 1 hour
    ));
};

server.prototype.index = function(req, res, next) {
    res.send(templates['App']());
};

server.prototype.abilities = function(req, res, next) {
    var js = 'var abilities = ' + JSON.stringify(abilities) + ';';
    res.send(js, {'Content-type': 'text/javascript'});
};

server.prototype.describeDatasource = function(req, res, next) {
    if (!req.query) return next(new Error('query is required.'));
    if (!req.query.id) return next(new Error('query.id is required.'));
    if (!req.query.project) return next(new Error('query.project is required.'));

    var SRS = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over';
    var mml = {
        srs: SRS,
        Stylesheet: [{id:'layer',data:''}],
        Layer: [{
            name: req.query.id,
            Datasource: _({
                file: req.query.url,
                type: req.query.ds_type
            }).extend(req.query),
            srs: SRS
        }]
    };
    var env = {
        data_dir: path.join(this.config.files, 'project', req.query.project),
        local_data_dir: path.join(this.config.files, 'project', req.query.project)
    };
    var map = new Map(mml, env);
    map.initialize(function(err) {
        if (err) return next(err);
        var ds = map.mapnik.describe_data()[req.query.id];
        res.datasource = {
            id: req.query.id,
            project: req.query.project,
            url: req.query.url,
            fields: ds.fields,
            features: req.param('option') === 'features'
                ? map.mapnik.features(0, 1000)
                : [],
            type: ds.type,
            geometry_type: ds.type === 'raster'
                ? 'raster'
                : ds.geometry_type
        };

        // Process fields and calculate min/max values.
        for (var f in res.datasource.fields) {
            res.datasource.fields[f] = {
                type: res.datasource.fields[f],
                max: _(res.datasource.features).chain().pluck(f)
                    .max(function(v) {
                        return _(v).isString() ? v.length : v;
                    }).value(),
                min: _(res.datasource.features).chain().pluck(f)
                    .min(function(v) {
                        return _(v).isString() ? v.length : v;
                    }).value()
            };
        }
        res.send(res.datasource);
    });
};
