var path = require('path'),
    tilelive = new (require('tilelive').Server)(require('tilelive-mapnik')),
    settings = Bones.plugin.config;

server = Bones.Server.extend({});

server.prototype.initialize = function() {
    _.bindAll(this, 'load', 'layer', 'tile');
    this.get('/1.0.0/:id/:z/:x/:y.:format(png8|png|jpeg[\\d]+|jpeg)', this.tile);
    this.get('/1.0.0/:id/:z/:x/:y.:format(grid.json)', this.load, this.tile);
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
    if (req.params.format === 'grid.json' && res.project) {
        if (!res.project.get('interactivity'))
            return next(new Error.HTTP('Not found.', 404));

        var interactivity = res.project.get('interactivity');
        req.params.layer = interactivity.layer;

        // Determine fields that need to be included from templates.
        // @TODO allow non-templated fields to be included.
        var fields = [
            interactivity.template_full || '',
            interactivity.template_teaser || '',
            interactivity.location || ''
        ].join(' ').match(/\[([\w\d]+)\]/g);
        req.params.fields = _(fields).chain()
            .filter(_.isString)
            .map(function(field) { return field.replace(/[\[|\]]/g, ''); })
            .uniq()
            .value();
        req.query.callback = 'grid'; // Force jsonp.
    }
    tilelive.serve(req.params, function(err, data) {
        if (err) return next(err);
        data[1]['max-age'] = 3600;
        res.send.apply(res, data);
    });
};

server.prototype.layer = function(req, res, next) {
    if (!res.project.get('formatter') && !res.project.get('legend')) {
        next(new Error.HTTP('Not found.', 404));
    } else {
        res.send({
            formatter: res.project.get('formatter'),
            legend: res.project.get('legend')
        });
    }
};
