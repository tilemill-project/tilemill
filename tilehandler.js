var _ = require('underscore')._,
    path = require('path'),
    Tile = require('tilelive.js').Tile;

var mapnik = require('mapnik');
mapnik.register_datasources('/usr/local/lib/mapnik2/input');
mapnik.register_fonts('/usr/local/lib/mapnik2/fonts/');

module.exports = function(app, settings) {
    app.get('/:scheme/:mapfile_64/:z/:x/:y.*', function(req, res, next) {
        /*
         * scheme: (xyz|tms|tile (tms))
         *
         * format:
         * - Tile: (png|jpg)
         * - Data Tile: (geojson)
         * - Grid Tile: (*.grid.json)
         */
        try {
            var tile = new Tile(
                req.params.scheme,
                req.params.mapfile_64,
                req.params.z,
                req.params.x,
                req.params.y,
                req.params[0],
                path.join(__dirname, settings.mapfile_dir));
        } catch (err) {
            res.send('Tile invalid: ' + err.message);
        }

        tile.render(function(err, data) {
            if (!err) {
                // Using apply here allows the tile rendering
                // function to send custom heades without access
                // to the request object.
                data[1] = _.extend(settings.header_defaults, data[1]);
                res.send.apply(res, data);
            } else {
                res.send('', { 'Content-Type': 'image/png' }, 500);
            }
        });
    });
}
