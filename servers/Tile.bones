var fs = require('fs');
var path = require('path');
var tilelive = require('tilelive');
var settings = Bones.plugin.config;

server = Bones.Server.extend({});

server.prototype.initialize = function() {
    _.bindAll(this, 'load', 'grid', 'getArtifact', 'mbtiles', 'fromCache');
    this.get('/1.0.0/:id.mbtiles/:z/:x/:y.:format(png8|png|jpeg[\\d]+|jpeg)', this.mbtiles);
    this.get('/1.0.0/:id.mbtiles/:z/:x/:y.:format(grid.json)', this.mbtiles);
    this.get('/1.0.0/:id/:z/:x/:y.:format(png8|png|jpeg[\\d]+|jpeg)', this.fromCache, this.load, this.getArtifact);
    this.get('/1.0.0/:id/:z/:x/:y.:format(grid.json)', this.fromCache, this.load, this.grid, this.getArtifact);
};

server.prototype.load = function(req, res, next) {
    res.project = new models.Project({ id: req.param('id') });
    res.project.fetch({
        success: function(model, resp) {
            model.localize(resp, next);
        },
        error: function(model, resp) {
            next(resp);
        }
    });
};

server.prototype.getArtifact = function(req, res, next) {
    // This is the cache key in tilelive-mapnik, so make sure it
    // contains the mtime with _updated.
    var id = req.params.id;
    var uri = {
        protocol: 'mapnik:',
        slashes: true,

        // This file does not exist; but we pass in literal strings below.
        // This is used as a cache key.
        pathname: path.join(settings.files, 'project', id, id + '.xml'),
        search: '?' + res.project.mml._updated,

        xml: res.project.xml,
        mml: res.project.mml
    };

    tilelive.load(uri, function(err, source) {
        if (err) return next(err);

        var z = req.params.z, x = +req.params.x, y = +req.params.y;

        // The interface is still TMS.
        y = (1 << z) - 1 - y;

        var fn = req.params.format === 'grid.json' ? 'getGrid' : 'getTile';
        source[fn](z, x, y, function(err, tile, headers) {
            if (err) return next(err);
            if (res.cache) fs.writeFile(res.cache, tile);
            if (headers) headers['max-age'] = 3600;
            res.send(tile, headers);
        });
    });
};

server.prototype.grid = function(req, res, next) {
    // Early exit. tilelive-mapnik would catch that too.
    if (!res.project.get('interactivity')) {
        return next(new Error.HTTP('Not found.', 404));
    }

    // Force jsonp.
    req.query.callback = 'grid';

    var interactivity = res.project.get('interactivity');
    res.project.mml.interactivity.fields = models.Project.fields(res.project.attributes);
    next();
};

server.prototype.mbtiles = function(req, res, next) {
    var uri = 'mbtiles://' + path.join(settings.files, 'export', req.param('id') + '.mbtiles');
    tilelive.load(uri, function(err, source) {
        if (err) return next(err);

        var z = req.params.z, x = +req.params.x, y = +req.params.y;

        // The interface is still TMS.
        y = (1 << z) - 1 - y;

        var fn = req.params.format === 'grid.json' ? 'getGrid' : 'getTile';
        source[fn](z, x, y, function(err, tile, headers) {
            if (err) return next(err);
            if (headers) headers['max-age'] = 3600;
            res.send(tile, headers);
        });
    });
};

server.prototype.fromCache = function(req, res, next) {
    if (!req.param('cache')) return next();

    var filename = [
        req.param('id'),
        req.param('z'),
        req.param('x'),
        req.param('y'),
        req.param('format')
    ].join('.');
    res.cache = path.join(settings.files, 'cache', 'tile', filename);
    fs.stat(res.cache, function(err, stat) {
        if (!err && +stat.mtime > req.param('updated')) {
            return res.sendfile(res.cache);
        } else {
            return next();
        }
    });
};

