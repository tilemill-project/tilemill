var _ = require('underscore'),
    url = require('url'),
    path = require('path'),
    Step = require('step'),
    Tile = require('tilelive').Tile,
    cache = require('models-cache');

module.exports = function(app, settings) {
    // Route middleware. Load a project model.
    var loadProject = function(req, res, next) {
        res.project = cache.get('Project', req.param('id'));
        if (res.project._fetched) {
            return next();
        } else {
            res.project.fetch({
                success: function(model, resp) {
                    next();
                },
                error: function(model, resp) {
                    next(new Error('Invalid model'));
                }
            });
        }
    };

    // GET endpoint for TMS tile image requests. Uses `tilelive.js` Tile API.
    //
    // - `:id` String, project model id.
    // - `:z` Number, zoom level of the tile requested.
    // - `:x` Number, x coordinate of the tile requested.
    // - `:y` Number, y coordinate of the tile requested.
    // - `*` String, file format of the tile requested, e.g. `png`, `jpeg`.
    app.get('/1.0.0/:id/:z/:x/:y.(png|png8|jpeg|jpeg[\+d])', loadProject, function(req, res, next) {
        try {
            var options = {
                datasource: res.project.toJSON(),
                xyz: [req.param('x'), req.param('y'), req.param('z')],
                format: req.params[0],
                mapfile_dir: settings.mapfile_dir
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

    // Interaction grid.json endpoint.
    app.get('/1.0.0/:id/:z/:x/:y.grid.json', loadProject, function(req, res, next) {
        req.query.callback = req.query.callback || 'grid';
        var interactivity = res.project.get('_interactivity');
        try {
            var options = {
                datasource: res.project.toJSON(),
                xyz: [req.param('x'), req.param('y'), req.param('z')],
                format: 'grid.json',
                mapfile_dir: settings.mapfile_dir,
                format_options: {
                    layer: parseInt(interactivity.layer, 10),
                    key_name: interactivity.key_name,
                    data: true
                }
            };
            var tile = new Tile(options);
        } catch (err) {
            res.send('Tile invalid: ' + err.message);
        }
        tile.render(function(err, grid) {
            if (err) {
                res.send(err.toString(), 500);
            } else if (!grid[0]) {
                res.send('Grid not found', 404);
            } else {
                var grid = grid[0].toString();
                res.send(
                    req.query.callback + '(' + grid + ');',
                    {'Content-Type': 'text/javascript; charset=utf-8'}
                );
            }
        });
    });

    // Interaction layer.json endpoint.
    app.get('/1.0.0/:id/layer.json', loadProject, function(req, res, next) {
        if (!res.project.get('_interactivity')) {
            res.send('Formatter not found', 404);
        } else {
            var json = {
                formatter: res.project.formatterJS(),
                legend: res.project.get('_legend')
            };
            res.send(json);
        }
    });
};
