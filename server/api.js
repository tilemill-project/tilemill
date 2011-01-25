var _ = require('underscore'),
    models = require('project');

module.exports = function(app, settings) {
    /**
     * Map loader, express route middleware.
     */
    function loadMap(req, res, next) {
        if (req.param('mapfile_64')) {
            var Map = require('tilelive.js').Map;
            var map = new Map(req.param('mapfile_64'), settings.mapfile_dir, true);
            map.localize(function(err) {
                if (err) {
                    next(new Error('Error loading map file'));
                } else {
                    res.map = map;
                    next();
                }
            });
        }
        else {
            next(new Error('Map could not be loaded.'));
        }
    }

    /**
     * Layer loader, express route middleware.
     */
    function loadLayer(req, res, next) {
        res.layers = [];
        res.map.mapnik_map_acquire(function(err, map) {
            var layers = map.layers();
            var data = map.describe_data();
            for (var i = 0; i < layers.length; i++) {
                var id = layers[i].name;
                var layer = {
                    id: id,
                    fields: {},
                    features: map.features(i)
                };

                for (var fieldId in data[id].fields) {
                    layer.fields[fieldId] = {type: data[id].fields[fieldId]};
                    var field = layer.fields[fieldId];
                    var values = _.pluck(layer.features, fieldId);
                    if (field.type == 'Number') {
                        field.min = Math.min.apply(Math, values);
                        field.max = Math.max.apply(Math, values);
                    }
                    else if (layer.fields[fieldId].type == 'String') {
                        field.min = _.min(values, function(value) { return value.length; }).length;
                        field.max = _.max(values, function(value) { return value.length; }).length;
                    }
                }

                if (!req.param('layer_id')) {
                    res.layers.push(layer);
                }
                else if (req.param('layer_id') === layer.id) {
                    res.layers.push(layer);
                }
            }
            res.map.mapnik_map_release(map);
            if (req.param('layer_id') && res.layers.length === 0) {
                next(new Error('Layer could not be loaded.'));
            } else {
                next();
            }
        });
    }

    /**
     * API status/version endpoint.
     */
    app.get('/api', function(req, res, params) {
      res.send({
        api: 'basic',
        version: 1.0
      });
    });

    /**
     * GET a model.
     */
    app.get('/api/:model/:id?', function(req, res, next) {
        if (typeof models[req.param('model')] !== 'undefined') {
            if (req.param('id')) {
                var model = new models[req.param('model')]({ id: req.param('id') });
                model.fetch({
                    success: function(model, resp) { res.send(model.toJSON()) },
                    error: function(model, resp) { res.send(resp, 500); }
                });
            }
            else if(typeof models[req.param('model') + 'List'] !== 'undefined') {
                var list = new models[req.param('model') + 'List']();
                list.fetch({
                    success: function(coll, resp) { res.send(coll.toJSON()) },
                    error: function(coll, resp) { res.send(resp, 500) }
                });
            }
            else {
                next();
            }
        }
        else {
            next();
        }
    });

    /**
     * PUT a model.
     */
    app.put('/api/:model/:id', function(req, res, next) {
        if (typeof models[req.param('model')] !== 'undefined') {
            var model = new models[req.param('model')](req.body);
            if (req.param('model') === 'Project') {
                model.validateAsync({
                    success: function(model) {
                        model.save(req.body, {
                            success: function(model, resp) { res.send(model.toJSON()) },
                            error: function(model, resp) { res.send(resp, 500); }
                        });
                    },
                    error: function(model, resp) {
                        res.send(resp, 500);
                    }
                });
            }
            else {
                model.save({}, {
                    success: function(model) {
                        model.save(req.body, {
                            success: function(model, resp) { res.send(model.toJSON()) },
                            error: function(model, resp) { res.send(resp, 500); }
                        });
                    },
                    error: function(model, resp) {
                        res.send(resp, 500);
                    }
                });
            }
        }
    });

    /**
     * POST a model.
     */
    app.post('/api/:model/:id', function(req, res, next) {
        if (typeof models[req.param('model')] !== 'undefined') {
            var model = new models[req.param('model')](req.body);
            if (req.param('model') === 'Project') {
                model.validateAsync({
                    success: function(model) {
                        model.save(req.body, {
                            success: function(model, resp) { res.send(model.toJSON()) },
                            error: function(model, resp) { res.send(resp, 500); }
                        });
                    },
                    error: function(model, resp) {
                        res.send(resp, 500);
                    }
                });
            }
            else {
                model.save({}, {
                    success: function(model) {
                        model.save(req.body, {
                            success: function(model, resp) { res.send(model.toJSON()) },
                            error: function(model, resp) { res.send(resp, 500); }
                        });
                    },
                    error: function(model, resp) {
                        res.send(resp, 500);
                    }
                });
            }
        }
    });

    /**
     * DELETE a model.
     */
    app.del('/api/:model/:id', function(req, res, next) {
        if (typeof models[req.param('model')] !== 'undefined') {
            var model = new models[req.param('model')]({ id: req.param('id') });
            model.destroy({
                success: function(model, resp) { res.send({}) },
                error: function(model, resp) { res.send(resp, 500); }
            });
        }
    });

    /**
     * Inspect abilities.
     */
    app.get('/api/abilities', function(req, res) {
        var mapnik = require('mapnik');
        res.send(
            {
                fonts: mapnik.fonts(),
                datasources: mapnik.datasources()
            }
        );
    });

    /**
     * Load layer model.
     */
    app.get('/api/:mapfile_64/:layer_id?', loadMap, loadLayer, function(req, res, next) {
        if (req.param('layer_id')) {
            res.send(res.layers.pop());
        }
        else {
            res.send(res.layers);
        }
    });
};

