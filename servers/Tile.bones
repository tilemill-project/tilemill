var fs = require('fs');
var path = require('path');
var tilelive = require('tilelive');
var settings = Bones.plugin.config;

server = Bones.Server.extend({});

server.prototype.initialize = function() {
    _.bindAll(this, 'fromCache', 'load', 'mbtiles');
    this.get('/tile/:id.mbtiles/:z/:x/:y.:format(png8|png|jpeg[\\d]+|jpeg|grid.json)',
        this.tilereq,
        this.mbtiles);
    this.get('/tile/:id/:z/:x/:y.:format(png8|png|jpeg[\\d]+|jpeg|grid.json)', [
        this.tilereq,
        this.fromCache,
        this.load]);
};

server.prototype.tilereq = function(req, res, next) {
    req.tilereq = true;
    return next();
};

server.prototype.load = function(req, res, next) {
    // This is the cache key in tilelive-mapnik, so make sure it
    // contains the mtime with _updated.
    var load = this.load;
    var id = req.params.id;
    var uri = {
        protocol: 'mapnik:',
        slashes: true,
        pathname: path.join(settings.files, 'project', id, id + '.xml'),
        query: {
            updated:req.query.updated,
            bufferSize:settings.bufferSize
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
            if (headers) headers['max-age'] = 3600;
            res.send(tile, headers);
        });
    });
};

server.prototype.mbtiles = function(req, res, next) {
    var uri = 'mbtiles://' +
        path.join(settings.files, 'export', req.param('id') + '.mbtiles');
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

