var path = require('path'),
    tilelive = require('tilelive'),
    settings = Bones.plugin.config;

server = Bones.Server.extend({});

server.prototype.initialize = function() {
    _.bindAll(this, 'load', 'grid', 'layer', 'getArtifact');
    this.get('/1.0.0/:id/:z/:x/:y.:format(png8|png|jpeg[\\d]+|jpeg)', this.load, this.getArtifact);
    this.get('/1.0.0/:id/:z/:x/:y.:format(grid.json)', this.load, this.grid, this.getArtifact);
    this.get('/1.0.0/:id/layer.json', this.load, this.layer);
};

server.prototype.load = function(req, res, next) {
    res.project = new models.Project({id: req.param('id')});
    res.project.fetch({
        success: function(model, resp) {
            res.projectMML = resp;
            next();
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
        pathname: path.join(settings.files, 'project', id, id + '.mml'),
        search: '_updated=' + res.projectMML._updated
    };

    tilelive.load(uri, function(err, source) {
        if (err) return next(err);

        var z = req.params.z, x = +req.params.x, y = +req.params.y;

        // The interface is still TMS.
        y = (1 << z) - 1 - y;

        var fn = req.params.format === 'grid.json' ? 'getGrid' : 'getTile';
        source[fn](z, x, y, function(err, tile, headers) {
            if (err) return next(err);
            headers['max-age'] = 3600;
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
    res.projectMML.interactivity.fields = models.Project.fields(interactivity);
    next();
};

server.prototype.layer = function(req, res, next) {
    if (!res.project.get('formatter') && !res.project.get('legend')) {
        next(new Error.HTTP('Not found.', 404));
    } else {
        req.query.callback = 'grid'; // Force jsonp.
        res.send({
            formatter: res.project.get('formatter'),
            legend: res.project.get('legend')
        });
    }
};
