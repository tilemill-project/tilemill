// GET endpoint for TMS tile image requests. Uses `tilelive.js` Tile API.
//
// - `:mapfile_64` String, base64 encoded mapfile URL. This mapfile will
//   determine the styles and data displayed on the map.
// - `:z` Number, zoom level of the tile requested.
// - `:x` Number, x coordinate of the tile requested.
// - `:y` Number, y coordinate of the tile requested.
// - `*` String, file format of the tile requested, e.g. `png`, `jpeg`.
var _ = require('underscore'),
    path = require('path'),
    Tile = require('tilelive').Tile;

module.exports = function(app, settings) {
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
                // Using `apply()` here allows the tile rendering function to
                // send custom headers without access to the request object.
                data[1] = _.extend(settings.header_defaults, data[1]);
                res.send.apply(res, data);
            } else if (typeof err === 'object' && err.length) {
                err = _.pluck(err, 'message').join("\n");
                res.send('Error rendering image:\n' + err, 500);
            } else {
                res.send('Error rendering image:\n' + err, 500);
            }
        });
    });
};
