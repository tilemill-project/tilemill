var fs = require('fs');
var path = require('path');
var tilelive = require('tilelive');
var settings = Bones.plugin.config;
var Step = require('step');
var readdir = require('../lib/fsutil.js').readdir;
var mapnik = require('mapnik');
var sm = new (require('sphericalmercator'))();
var carto = require('carto');
var climaSettings = require("../clima-settings.json");

server = Bones.Server.extend({});
server.prototype.port = 20008;
server.prototype.start = function(callback) {
    if (this.plugin.config.tileSocket) {
        this.port = null;
        this.listen(this.plugin.config.tileSocket, callback);
    } else if (this.port) {
        this.listen(this.port, this.plugin.config.listenHost, callback);
    }
    return this;
};

server.prototype.initialize = function() {
    _.bindAll(this, 'thumb', 'projectStatus', 'load', 'mbtiles', 'image');
    this.port = settings.tilePort || this.port;
    this.enable('jsonp callback');
    this.use(this.cors);
    this.all('/tile/:id.mbtiles/:z/:x/:y.:format(png|grid.json)', this.mbtiles);
    this.all('/tile/:id/:z/:x/:y.:format(png|grid.json)', this.load);
    this.all('/tile/:id/thumb.png', this.thumb);
    this.all('/tile/:id/image', this.image);
    this.get('/tile/:id/project-status', this.projectStatus);
    this.all('/datasource/:id', this.datasource);
    this.get('/status', this.status);
    this.post('/restart', this.restart);
    this.get('/clear-mapnik-cache', this.clearMapnikCache);
    // Special error handler for tile requests.
    this.error(function(err, req, res, next) {
        err.status = err.status || 500;
        res.send(err.message, err.status);
    });
};

server.prototype.image = function(req, res, next) {
    var id = req.params.id;
    (new models.Project({id:req.param('id')})).fetch({
        success: function(model, resp) {
            model.localize(resp, function(err) {
                if (err) return next(err);
                try {
                    var im = new mapnik.Image(+req.query.width,+req.query.height);
                    var map = new mapnik.Map(im.width(),im.height());
                    var bbox = _(req.query.bbox.split(',')).map(parseFloat);
                    map.fromStringSync(model.xml, {
                        strict: false,
                        base: path.join(settings.files, 'project', id) + '/'
                    });
                    map.extent = sm.convert(bbox, '900913');
                    var opts = {
                        scale_denominator: carto.tree.Zoom.ranges[req.query.static_zoom] || 0.0,
                        scale: model.mml.scale
                    }
                    map.render(im,opts,function(err,im){
                        if (err) return next(err);
                        im.encode('png24',function(err,tile) {
                            if (err) return next(err);
                            res.send(tile,{ 'Content-Type': 'image/png' });
                        });
                    });
                } catch (err) {
                    return next(err);
                }
            });
        },
        error: function(model, resp) { next(resp) }
    });
}

server.prototype.projectStatus = function(req, res, next) {
    var model = new models.Project({
        id: req.param('id')
    });
    model.sync('status', model, res.send.bind(res), next);
};

server.prototype.clearMapnikCache = function(req, res, next) {
    mapnik.clearCache();
    res.send({});
};

server.prototype.load = function(req, res, next) {
    // This is the cache key in tilelive-mapnik, so make sure it
    // contains the mtime with _updated. These attributes should be
    // known via the request and not by loading the project. They are
    // used in tilelive-mapnik to generate the tilelive source cache key.
    var load = this.load;
    var id = req.params.id;
    var uri = {
        protocol: 'mapnik:',
        slashes: true,
        pathname: path.join(settings.files, 'project', id, id + '.xml'),
        query: {
            updated:req.query.updated,
            scale: +req.query.scale || 1.0,
            metatile: req.query.metatile|0 || 2,
            autoLoadFonts: false
        },
        // Need not be set for a cache hit. Once the cache is
        // warmed the project need not be loaded/localized again.
        xml: req.project && req.project.xml,
        mml: req.project && req.project.mml
    };

    tilelive.load(uri, function(err, source) {
        if (err && err.code !== 'ENOENT') return next(err);

        // Fetch, localize the project, then call #load again with
        // req.project populated.
        if (!source) return (new models.Project({id:req.param('id')})).fetch({
            success: function(model, resp) {
                model.localize(resp, function(err) {
                    if (err) return next(err);
                    req.project = model;
                    load(req, res, next);
                });
            },
            error: function(model, resp) { next(resp) }
        });

        var z = req.params.z,
            x = +req.params.x,
            y = +req.params.y;

        req.query.callback = 'grid';
        var fn = req.params.format === 'grid.json' ? 'getGrid' : 'getTile';
        source[fn](z, x, y, function(err, tile, headers) {
            if (err) return next(new Error.HTTP(err.message, 404));
            if (res.cache) fs.writeFile(res.cache, tile);
            if (headers) headers['Cache-control'] = 'max-age=3600';
            res.send(tile, headers);
        });
    });
};

server.prototype.mbtiles = function(req, res, next) {
    var filepath = path.join(settings.files, 'export', req.param('id') + '.mbtiles');
    var uri = {protocol:'mbtiles:',pathname:filepath};
    tilelive.load(uri, function(err, source) {
        if (err) return next(err);

        var z = req.params.z,
            x = +req.params.x,
            y = +req.params.y;
        // The interface is still TMS.
        y = (1 << z) - 1 - y;

        req.query.callback = 'grid';
        var fn = req.params.format === 'grid.json' ? 'getGrid' : 'getTile';
        source[fn](z, x, y, function(err, tile, headers) {
            if (err) return next(new Error.HTTP(err.message, 404));
            if (headers) headers['Cache-control'] = 'max-age=3600';
            res.send(tile, headers);
        });
    });
};

// Load thumb from project dir. If it does not exist, fallback to
// legacy cache/tile dir and grab most recent thumb image.
// @TODO: fallback can be deprecated at 1.0.
server.prototype.thumb = function(req, res, next) {
    var thumbPath = path.resolve(path.join(settings.files, 'project', req.param('id'), '.thumb.png'));
    Step(function() {
        fs.stat(thumbPath, this);
    }, function(err) {
        if (!err) return res.sendfile(path.basename(thumbPath), {hidden:true,maxAge:36e5,root: path.dirname(thumbPath)});
        readdir(path.resolve(path.join(settings.files, 'cache', 'tile')), this);
    }, function(err, files) {
        if (err) return next(err);
        if (!files.length) return res.send(404);
        var file = _(files).chain()
            .sortBy(function(f) { return -1 * new Date(f.ctime).getTime(); })
            .pluck('basename')
            .filter(function(n) { return n.indexOf(req.param('id')+'.') === 0; })
            .first()
            .value();
        if (!file) return res.send(404);
        var file_to_send = path.resolve(path.join(settings.files, 'cache', 'tile', file));
        res.sendfile(path.basename(file_to_send), {root:path.dirname(file_to_send)});
    });
};

server.prototype.datasource = function(req, res, next) {
    var model = new models.Datasource({id:req.param('id')}, req.query);

    // changed for clima: hardcode the postgres connection info
    req.query["host"] = climaSettings["host"];
    req.query["port"] = climaSettings["port"];
    req.query["user"] = climaSettings["user"];
    req.query["password"] = climaSettings["password"];
    req.query["dbname"] = climaSettings["dbname"];

    Bones.utils.fetch({model:model}, function(err) {
        if (err) return next(err);
        res.send(model.toJSON());
    });
};

server.prototype.cors = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.end();
    else return next();
};

server.prototype.status = function(req, res, next) {
    res.send({});
};

server.prototype.restart = function(req, res, next) {
    res.send({});
    console.warn('Stopping tile server...');
    process.exit();
};

