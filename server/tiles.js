var _ = require('underscore')._,
    path = require('path'),
    Tile = require('tilelive.js').Tile;

module.exports = function(app, settings) {
    /**
     * format:
     * - Tile: (png|jpg)
     * - Data Tile: (geojson)
     * - Grid Tile: (*.grid.json)
     */
    app.get('/1.0.0/:mapfile_64/:z/:x/:y.*', function(req, res, next) {
        try {
            var options = {
                scheme: 'tms',
                mapfile: req.param('mapfile_64'),
                xyz: [req.param('x'), req.param('y'), req.param('z')],
                format: req.params[0],
                mapfile_dir: path.join(settings.mapfile_dir)
            };
            var tile = new Tile(options);
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
                res.send('Error rendering image: ' + err, 500);
                // res.send('', { 'Content-Type': 'image/png' }, 500);
            }
        });
    });
};
