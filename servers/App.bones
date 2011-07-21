var mapnik = require('tilelive-mapnik/node_modules/mapnik');
var env = process.env.NODE_ENV || 'development';

var abilities = {
    carto: require('carto').tree.Reference.data,
    // carto: require('tilelive-mapnik/node_modules/carto').tree.Reference.data,
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
    this.get('/api/Project/:id/:time(\\d+)', this.projectPoll);
    this.del('/api/Project/:id/:layer', this.projectFlush);

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

server.prototype.projectPoll = function(req, res, next) {
    var model = new models.Project({
        id: req.param('id'),
        _updated: req.param('time')
    });
    model.sync('mtime', model, res.send.bind(res), next);
};

server.prototype.projectFlush = function(req, res, next) {
    var model = new models.Project(
        { id: req.param('id') },
        { layer: req.param('layer') }
    );
    model.sync('flush', model, res.send.bind(res), next);
};
