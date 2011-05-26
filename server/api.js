// REST endpoints for Backbone models and collections.
var _ = require('underscore'),
    mapnik = require('mapnik'),
    models = require('models'),
    cache = require('models-cache'),
    Step = require('step'),
    reference = require('carto').tree.Reference.data;
    External = require('carto').External;

module.exports = function(app, settings) {
    // Route middleware for loading a datasource. Currently has a hard limit
    // on loading 10,000 features to keep a large datasource from busting up
    // the server.
    function loadDatasource(req, res, next) {
        if (!req.query) {
            return res.send('Bad request.', 400);
        }

        var datasourceStats = function(datasource) {
            for (var fieldId in datasource.fields) {
                datasource.fields[fieldId] = {
                    type: datasource.fields[fieldId]
                };
                var field = datasource.fields[fieldId];
                var values = _.pluck(datasource.features, fieldId);
                if (values.length) {
                    if (field.type == 'Number') {
                        field.min = Math.min.apply(Math, values);
                        field.max = Math.max.apply(Math, values);
                    }
                    else if (datasource.fields[fieldId].type == 'String') {
                        field.min = _.min(values,
                            function(value) { return value.length; }).length;
                        field.max = _.max(values,
                            function(value) { return value.length; }).length;
                    }
                } else {
                    field.max = 0;
                    field.min = 0;
                }
            }
        }

        if (req.query.ds_type == 'postgis') {
            var options = req.query;
            options.type = 'postgis';
            try {
                if (req.param('option') !== 'features') {
                    options.row_limit = 1;
                }
                var ds = new mapnik.Datasource(options);
            } catch (e) {
                return next('Datasource could not be loaded.' + e.message);
            }
            res.datasource = _.extend({
                ds_type: options.type,
                fields: {},
                features: req.param('option') === 'features'
                    ? ds.features(0, 1000)
                    : []
            }, ds.describe());
            datasourceStats(res.datasource);
            return next();
        } else {
            // File based datasources need to be downloaded through External().
            var url = req.query.url;
            var external = new External(settings, url);
            external.on('err', function(err) {
                return next('Datasource could not be loaded. Error: ' + err.message);
            });
            external.on('complete', function(external) {
                external.findDataFile(function(err, file) {
                    if (err || !file) {
                        return next(new Error('Datasource could not be loaded.'));
                    }
                    try {
                        var ds = new mapnik.Datasource(_.extend({
                            file: file
                        }, external.type.ds_options));
                    } catch (e) {
                        return next('Datasource could not be loaded.');
                    }
                    if (external.type.ds_options.type !== 'gdal') {
                        res.datasource = _.extend({
                            ds_options: external.type.ds_options,
                            ds_type: external.type.ds_options.type,
                            fields: {},
                            features: req.param('option') === 'features'
                                ? ds.features(0, 1000)
                                : []
                        }, ds.describe());
                        datasourceStats(res.datasource);
                    } else {
                        res.datasource = {
                            ds_options: external.type.ds_options,
                            ds_type: external.type.ds_options.type,
                            geometry_type: 'raster',
                            fields: {},
                            features: []
                        };
                    }
                    next();
                });
            });
        }
    }

    // Route middleware for validating a model.
    function validateModel(req, res, next) {
        if (models[req.param('model')]) {
            next();
        } else {
            next(new Error('Invalid model.'));
        }
    };

    // Route middleware for validating a collection.
    function validateCollection(req, res, next) {
        if (models[req.param('model') + 'List']) {
            next();
        } else {
            next(new Error('Invalid collection.'));
        }
    };

    // API
    // ---
    // Describes the current version of the API supported.
    app.get('/api', function(req, res, params) {
        res.send({ version: 1.0 });
    });

    // GET Abilities (Backbone model)
    // ------------------------------
    // GET endpoint for the Abilities model which describes the capabilities
    // of the mapnik renderer.
    app.get('/api/Abilities', function(req, res) {
        res.send({
            'fonts': mapnik.fonts(),
            'datasources': mapnik.datasources(),
            'exports': {
                mbtiles: true,
                png: true,
                pdf: mapnik.supports.cairo
            }
        });
    });

    // GET Reference (Backbone model)
    // ------------------------------
    // GET endpoint for the Reference model which describes the symbolizers
    // and colors supported by Mapnik
    app.get('/api/Reference', function(req, res) {
        res.send(reference);
    });

    // GET Datasource (Backbone model)
    // -------------------------------
    // GET endpoint for datasource models. The datasource ID is its base64
    // encoded url. See `loadDatasource()` for use of `carto` and `mapnik` to
    // localize and analyze the datasource.
    app.get('/api/Datasource/:option?', loadDatasource, function(req, res, next) {
        res.send(res.datasource);
    });

    // GET Library (Backbone collection)
    // ---------------------------------
    // GET endpoint for library assets. Loads the library model and uses its
    // `type` to determine which library plugin should be used for generating
    // the list of assets.
    app.get('/api/Library/:id/assets/:page?', function(req, res) {
        var model = cache.get('Library', req.param('id'));
        model.fetch({
            success: function(model, resp) {
                var options = _.extend({
                    page: req.param('page') || 0,
                    limit: 100, // @TODO
                }, model.toJSON());
                require('library-' + model.get('type'))(
                    app,
                    options,
                    function(assets) {
                        res.send(assets);
                    }
                );
            },
            error: function(model, resp) {
                res.send([]);
            }
        });
    });

    // GET file for Directory Library
    // ------------------------------
    // GET endpoint for file downloads for the Directory library. See
    // `library-directory.js`.
    app.get('/api/Library/:id/files/*', function(req, res, next) {
        var path = require('path');
        var model = cache.get('Library', req.param('id'));
        model.fetch({
            success: function(model, resp) {
                if (model.get('type') === 'directory') {
                    // @TODO: make path secure!
                    res.sendfile(
                        path.join(model.get('directory_path'), req.params[0]),
                        function(err, path) {
                            return err && next(err);
                        }
                    );
                }
            },
            error: function(model, resp) {
                next(new Error('File not found'));
            }
        });
    });

    // GET Collection (all)
    // --------------------
    // GET endpoint for all Backbone collections. The model class is specified
    // in the route rule - a corresponding collection name with the suffix
    // `List` is used.
    app.get('/api/:model', validateCollection, function(req, res, next) {
        var list = new models[req.param('model') + 'List']();
        list.fetch({
            success: function(coll, resp) { res.send(coll.toJSON()) },
            error: function(coll, resp) { res.send(resp, 500) }
        });
    });

    // GET Model (all)
    // ---------------
    // GET endpoint for all Backbone models.
    app.get('/api/:model/:id', validateModel, function(req, res, next) {
        var model = cache.get(req.param('model'), req.param('id'));
        model.fetch({
            success: function(model, resp) { res.send(model.toJSON()) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    });

    // POST Model (all)
    // ----------------
    // POST endpoint for all Backbone models.
    app.post('/api/:model/:id', validateModel, function(req, res, next) {
        var id = req.body.id || require('crypto')
            .createHash('md5')
            .update(+new Date)
            .digest('hex')
            .substring(0,6);
        var model = cache.get(req.param('model'), id);
        if (req.param('model') === 'Project') {
            model.validateAsync(req.body, {
                success: function(model) {
                    model.save(req.body, {
                        success: function(model, resp) { res.send(resp); },
                        error: function(model, resp) { res.send(resp, 500); }
                    });
                },
                error: function(model, resp) {
                    res.send(resp, 500);
                }
            });
        } else {
            model.save(req.body, {
                success: function(model, resp) { res.send(resp); },
                error: function(model, resp) { res.send(resp, 500); }
            });
        }
    });

    // PUT Model (all)
    // ---------------
    // PUT endpoint for all Backbone models.
    app.put('/api/:model/:id', validateModel, function(req, res, next) {
        var model = cache.get(req.param('model'), req.param('id'));
        if (req.param('model') === 'Project') {
            model.validateAsync(req.body, {
                success: function(model) {
                    model.save(req.body, {
                        success: function(model, resp) { res.send(resp); },
                        error: function(model, resp) { res.send(resp, 500); }
                    });
                },
                error: function(model, resp) {
                    res.send(resp, 500);
                }
            });
        }
        else {
            model.save(req.body, {
                success: function(model, resp) { res.send(resp); },
                error: function(model, resp) { res.send(resp, 500); }
            });
        }
    });

    // DELETE Model (all)
    // ------------------
    // DELETE endpoint for all Backbone models.
    app.del('/api/:model/:id', validateModel, function(req, res, next) {
        var model = cache.get(req.param('model'), req.param('id'));
        model.trigger('delete');
        model.destroy({
            success: function(model, resp) { res.send({}) },
            error: function(model, resp) { res.send(resp, 500); }
        });
        cache.del(req.param('model'), req.param('id'));
    });

    // Generic error handler.
    app.error(function(err, req, res){
        err.message && (err = err.message);
        res.send(err, 500);
    });
};

