var mapnik = require('mapnik');
var fs = require('fs');
var path = require('path');
var env = process.env.NODE_ENV || 'development';

var abilities = {
    tilemill: JSON.parse(fs.readFileSync(path.resolve(__dirname + '/../package.json'),'utf8')),
    carto: require('carto').tree.Reference.data,
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
    _(this).bindAll(
        'index',
        'abilities',
        'projectPoll',
        'projectFlush'
    );

    this.get('/', this.index);
    this.get('/assets/tilemill/js/abilities.js', this.abilities);

    // Custom Project sync endpoints.
    this.get('/api/Project/:id.xml', this.projectXML);
    this.get('/api/Project/:id/:time(\\d+)', this.projectPoll);
    this.del('/api/Project/:id/:layer', this.projectFlush);

    // Add static provider to download exports.
    this.use('/export/download', middleware['static'](
        path.join(this.config.files, 'export'),
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

server.prototype.projectPoll = function(req, res, next) {
    var model = new models.Project({
        id: req.param('id'),
        _updated: req.param('time')
    });
    model.sync('mtime', model, res.send.bind(res), next);
};

server.prototype.projectFlush = function(req, res, next) {
    if (!req.param('url')) return next(new Error('req.query.url required.'));

    var model = new models.Project(
        { id: req.param('id') },
        { layer: req.param('layer'), url: req.param('url') }
    );
    model.sync('flush', model, res.send.bind(res), next);
};

server.prototype.projectXML = function(req, res, next) {
    var model = new models.Project({ id: req.param('id') });
    model.fetch({
        success: function(model, resp) {
            model.localize(model.toJSON(), function(err) {
                if (err) return next(err);
                res.send(model.xml, {'content-type': 'text/xml'});
            });
        },
        error: function(model, resp) { next(resp); }
    });
};
