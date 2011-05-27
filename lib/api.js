// REST endpoints for Backbone models and collections.
var _ = require('underscore'),
    Map = require('tilelive-mapnik').Map,
    models = require('models'),
    path = require('path'),
    Step = require('step'),
    mapnik = require('tilelive-mapnik/node_modules/mapnik'),
    reference = require('tilelive-mapnik/node_modules/carto').tree.Reference.data;

module.exports = function(app, settings) {
    // Route middleware for loading a datasource. Currently has a hard limit
    // on loading 10,000 features to keep a large datasource from busting up
    // the server.
    function loadDatasource(req, res, next) {
        if (!req.query) return next(new Error('query is required.'));
        if (!req.query.id) return next(new Error('query.id is required.'));
        if (!req.query.project) return next(new Error('query.project is required.'));

        var SRS = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over';
        var mml = {
            srs: SRS,
            Stylesheet: [{id:'layer',data:''}],
            Layer: [{
                name: req.query.id,
                Datasource: _({
                    file: req.query.url,
                    type: req.query.ds_type
                }).extend(req.query),
                srs: SRS
            }]
        };
        var env = {
            data_dir: path.join(settings.files, 'project', req.query.project),
            local_data_dir: path.join(settings.files, 'project', req.query.project)
        };
        var map = new Map(mml, env);
        map.initialize(function(err) {
            if (err) return next(err);
            var ds = map.mapnik.describe_data()[req.query.id];
            res.datasource = {
                id: req.query.id,
                project: req.query.project,
                url: req.query.url,
                fields: ds.fields,
                features: req.param('option') === 'features'
                    ? map.mapnik.features(0, 1000)
                    : [],
                type: ds.type,
                geometry_type: ds.type === 'raster'
                    ? 'raster'
                    : ds.geometry_type
            };

            // Process fields and calculate min/max values.
            for (var f in res.datasource.fields) {
                res.datasource.fields[f] = {
                    type: res.datasource.fields[f],
                    max: _(res.datasource.features).chain().pluck(f)
                        .max(function(v) {
                            return _(v).isString() ? v.length : v;
                        }).value(),
                    min: _(res.datasource.features).chain().pluck(f)
                        .min(function(v) {
                            return _(v).isString() ? v.length : v;
                        }).value()
                };
            }
            next();
        });
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
        var model = new models.Library({id: req.param('id')});
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
        var model = new models.Library({id: req.param('id')});
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
        var model = new models[req.param('model')]({id: req.param('id')});
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
        var model = new models[req.param('model')]({id: req.param('id')});
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
        var model = new models[req.param('model')]({id: req.param('id')});
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
        var model = new models[req.param('model')]({id: req.param('id')});
        model.destroy({
            success: function(model, resp) { res.send({}) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    });

    // // Generic error handler.
    app.error(function (err, req, res, next) {
        var env = process.env.NODE_ENV || 'development';
        if (!err.status) err.status = 500;

        if ((req.headers.accept + '' || '').indexOf('json') >= 0) {
            res.writeHead(err.status, { 'Content-Type': 'application/json' });
            if (env === 'development') {
                res.end(JSON.stringify(err));
            } else {
                res.end(JSON.stringify({ message: err.message }));
            }
        } else {
            res.writeHead(err.status, { 'Content-Type': 'text/plain' });
            if (env === 'development') {
                res.end(err.stack);
            } else {
                res.end(err.message);
            }
        }
    });

    // Add Express route rule for serving export files for download.
    app.get('/export/download/*', function(req, res, next) {
        res.download(
            path.join(settings.export_dir, req.params[0]),
            req.params[0],
            function(err, path) {
                return err && next(new Error('File not found.'));
            }
        );
    });
};

