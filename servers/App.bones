var mapnik = require('tilelive-mapnik/node_modules/mapnik'),
    reference = require('tilelive-mapnik/node_modules/carto').tree.Reference.data;

server = Bones.Server.extend({});

server.prototype.initialize = function() {
    _.bindAll(this, 'index', 'support');
    this.get('/', this.index);
    this.get('/assets/tilemill/js/support.js', this.support);
};

server.prototype.index = function(req, res, next) {
    res.send(templates['App']());
};

server.prototype.support = function(req, res, next) {
    var template = _.template(
        'var tilemill = tilemill || {};\n\n' +
        'tilemill.ABILITIES = <%= JSON.stringify(abilities) %>;\n\n' +
        'tilemill.REFERENCE = <%= JSON.stringify(reference) %>;\n\n'
    );
    res.send(template({
        abilities: {
            'fonts': mapnik.fonts(),
            'datasources': mapnik.datasources(),
            'exports': {
                mbtiles: true,
                png: true,
                pdf: mapnik.supports.cairo
            }
        },
        reference: reference
    }), {'Content-Type': 'text/javascript'});
};
