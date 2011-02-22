var _ = require('underscore'),
    url = require('url'),
    path = require('path'),
    Step = require('step'),
    Tile = require('tilelive').Tile,
    Pool = require('tilelive').Pool,
    cache = require('models-cache');

module.exports = function(app, settings) {
    // Route middleware. Load a project model.
    var loadProject = function(req, res, next) {
        var model = cache.get('Project', req.param('id'));
        model.fetch({
            success: function(model, resp) {
                res.project = model;
                next();
            },
            error: function(model, resp) {
                next(new Error('Invalid model'));
            }
        });
    };

    // Load and cache features for the particular project. These will be used
    // by grid.json to provide feature data.
    // @TODO: remove this functionality once node-mapnik can return the `data`
    // key from render_grid.
    var featureCache = {};
    var loadFeatures = function(req, res, next) {
        if (!res.project.get('_interactivity')) return next();

        var that = this;
        var resource;
        var options = { mapfile_dir: settings.mapfile_dir };
        var interactivity = res.project.get('_interactivity');
        if (featureCache[res.project.id]) {
            res.features = featureCache[res.project.id];
            next();
        } else {
            Step(
                function() {
                    Pool.acquire('map', res.project.toJSON(), options, this);
                },
                function(err, r) {
                    if (err) return this(err);
                    resource = r;
                    featureCache[res.project.id] = _.reduce(
                        resource.mapnik.features(interactivity.layer),
                        function(features, feature) {
                            if (feature[interactivity.key_name]) {
                                var key = feature[interactivity.key_name].toString();
                                features[key] = feature;
                            }
                            return features;
                        },
                        {}
                    );
                    res.features = featureCache[res.project.id];
                    this();
                },
                function(err, data) {
                    Pool.release('map', res.project.toJSON(), resource);
                    next();
                }
            );
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
    app.get('/1.0.0/:id/:z/:x/:y.grid.json', loadProject, loadFeatures, function(req, res, next) {
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
                    key_name: interactivity.key_name
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
                // @TODO: remove
                var keys = grid[2].keys;
                var grid = grid[0].toString();

                // @TODO: remove
                var data = _.reduce(
                    res.features,
                    function(features, feature) {
                        if (feature[interactivity.key_name]) {
                            var key = feature[interactivity.key_name].toString();
                            (keys.indexOf(key) !== -1) && (features[key] = feature);
                        }
                        return features;
                    },
                    {}
                );

                // Manually append grid data as a string to the grid buffer.
                // Ideally we would
                //
                //     JSON.stringify(_.extend(JSON.parse(grid), { data: gd }))
                //
                // But calling JSON stringify will escape UTF8 characters of a
                // high enough ordinal making the grid data unusable. Instead,
                // manipulate the JSON string directly, popping the trailing }
                // off and splicing the grid data in at the "data" key.
                grid = grid.substr(0, grid.length - 1)
                    + ', "data":'
                    + JSON.stringify(data)
                    + '}';

                res.send(
                    req.query.callback + '(' + grid + ');',
                    {'Content-Type': 'text/javascript; charset=utf-8'}
                );
            }
        });
    });

    // Interaction formatter.json endpoint.
    app.get('/1.0.0/:id/formatter.json', loadProject, function(req, res, next) {
        if (!res.project.get('_interactivity')) {
            res.send('Formatter not found', 404);
        } else {
            var json = { formatter: res.project.formatterJS() };
            res.send(json);
        }
    });
};
