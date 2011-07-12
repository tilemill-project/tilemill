var mapnik = require('tilelive-mapnik/node_modules/mapnik');
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

server.prototype.initialize = function() {
    _(this).bindAll('index', 'abilities');
    this.get('/', this.index);
    this.get('/assets/tilemill/js/abilities.js', this.abilities);
};

server.prototype.index = function(req, res, next) {
    res.send(templates['App']());
};

server.prototype.abilities = function(req, res, next) {
    var js = 'var abilities = ' + JSON.stringify(abilities) + ';';
    res.send(js, {'Content-type': 'text/javascript'});
};
