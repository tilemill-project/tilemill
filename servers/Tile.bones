var path = require('path'),
    tilelive = new (require('tilelive').Server)(require('tilelive-mapnik')),
    settings = Bones.plugin.config;

server = Bones.Server.extend({});

server.prototype.initialize = function() {
    _.bindAll(this, 'load', 'layer', 'tile');
    this.get('/1.0.0/:id/:z/:x/:y.(png8|png|jpeg[\\d]+|jpeg)', this.tile);
    this.get('/1.0.0/:id/:z/:x/:y.grid.json', this.load, this.tile);
    this.get('/1.0.0/:id/layer.json', this.load, this.layer);
};

server.prototype.load = function(req, res, next) {
    res.project = new models.Project({id: req.param('id')});
    res.project.fetch({
        success: function(model, resp) { next(); },
        error: function(model, resp) { next(resp); }
    });
};

server.prototype.tile = function(req, res, next) {
    req.params.datasource = path.join(
        settings.files,
        'project',
        req.param('id'),
        req.param('id') + '.mml'
    );
    req.params.format = req.params[0];
    if (req.params.format === 'grid.json' && res.project) {
        var interactivity = res.project.get('_interactivity');
        req.params.layer = interactivity.layer;
        req.params.fields = res.project.formatterFields();
    }
    tilelive.serve(req.params, function(err, data) {
        if (err) return next(err);
        data[1]['max-age'] = 3600;
        res.send.apply(res, data);
    });
};

server.prototype.layer = function(req, res, next) {
    if (!res.project.get('_interactivity') && !res.project.get('_legend')) {
        next(new Error('Formatter not found.'));
    } else {
        res.send({
            formatter: res.project.formatterJS(),
            legend: res.project.get('_legend')
        });
    }
};
