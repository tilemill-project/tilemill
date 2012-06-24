var fs = require('fs');
var path = require('path');
var tilelive = require('tilelive');
var settings = Bones.plugin.config;
var Step = require('step');
var readdir = require('../lib/fsutil.js').readdir;

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
    _.bindAll(this, 'thumb', 'load', 'mbtiles');
    this.port = settings.tilePort || this.port;
    this.enable('jsonp callback');
    this.use(this.cors);
    this.all('/tile/:id.mbtiles/:z/:x/:y.:format(png|grid.json)', this.mbtiles);
    this.all('/tile/:id/:z/:x/:y.:format(png|grid.json)', this.load);
    this.all('/tile/:id/thumb.png', this.thumb);
    this.all('/datasource/:id', this.datasource);
    this.get('/status', this.status);
    this.post('/restart', this.restart);
    // Special error handler for tile requests.
    this.error(function(err, req, res, next) {
        err.status = err.status || 500;
        res.send(err.message, err.status);
    });
};

server.prototype.load = function(req, res, next) {
    // This is the cache key in tilelive-mapnik, so make sure it
    // contains the mtime with _updated.
    var load = this.load;
    var id = req.params.id;
    var tileSize = 256;
    var scale = (req.project && req.project.attributes.scale) || 1;
    if (req.query.scale) {
        scale *= parseFloat(req.query.scale);
        tileSize *= parseFloat(req.query.scale);
    }

    var uri = {
        protocol: 'mapnik:',
        slashes: true,
        pathname: path.join(settings.files, 'project', id, id + '.xml'),
        query: {
            updated: req.query.updated,
            scale: scale,
            metatile: req.project && req.project.attributes.metatile,
            tileSize: tileSize
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
        if (!err) return res.sendfile(thumbPath, {hidden:true,maxAge:36e5});
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
        res.sendfile(path.resolve(path.join(settings.files, 'cache', 'tile', file)));
    });
};

server.prototype.datasource = function(req, res, next) {
    var model = new models.Datasource({id:req.param('id')}, req.query);
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

