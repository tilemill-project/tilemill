var _ = require('underscore'),
    mapnik = require('mapnik'),
    models = require('models-server'),
    External = require('mess').External;

module.exports = function(app, settings) {
    function loadDatasource(req, res, next) {
        if (req.param('id')) {
            var url = req.param('id').replace('+', '-').replace('/', '_');
            url = (new Buffer(url, 'base64')).toString('utf-8');
            var external = new External(settings, url);
            external.on('err', function(external) {
                return next('Datasource could not be loaded.');
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
                        return next('The datasource could not be loaded.');
                    }
                    if (external.type.ds_options !== 'gdal') {
                        res.datasource = _.extend({
                            fields: {},
                            ds_options: external.type.ds_options,
                            features: ds.features()
                        }, ds.describe());
                        for (var fieldId in res.datasource.fields) {
                            res.datasource.fields[fieldId] = {
                                type: res.datasource.fields[fieldId]
                            };
                            var field = res.datasource.fields[fieldId];
                            var values = _.pluck(res.datasource.features, fieldId);
                            if (field.type == 'Number') {
                                field.min = Math.min.apply(Math, values);
                                field.max = Math.max.apply(Math, values);
                            }
                            else if (res.datasource.fields[fieldId].type == 'String') {
                                field.min = _.min(values,
                                    function(value) { return value.length; }).length;
                                field.max = _.max(values,
                                    function(value) { return value.length; }).length;
                            }
                        }
                    } else {
                        res.datasource = {
                            ds_options: external.type.ds_options,
                            fields: {
                                none: 'String'
                            },
                            features: [
                                { none: 'Rasters do not contain fields.' }
                            ]
                        };
                    }
                    next();
                });
            });
        } else {
            next(new Error('Datasource could not be loaded.'));
        }
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
     * Load datasource model. Exception to general GET rule below.
     */
    app.get('/api/Datasource/:id', loadDatasource, function(req, res, next) {
        res.send(res.datasource);
    });

    /**
     * GET a model.
     */
    app.get('/api/:model/:id?', function(req, res, next) {
        if (typeof models[req.param('model')] !== 'undefined') {
            if (req.param('id')) {
                var model = models.cache.get(req.param('model'), req.param('id'));
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
            var model = models.cache.get(req.param('model'), req.param('id'));
            model.set(req.body);
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
                model.save(req.body, {
                    success: function(model, resp) { res.send(model.toJSON()) },
                    error: function(model, resp) { res.send(resp, 500); }
                });
            }
        }
    });

    /**
     * POST a model.
     */
    app.post('/api/:model/:id', function(req, res, next) {
        if (typeof models[req.param('model')] !== 'undefined') {
            var id = req.body.id || require('crypto')
                .createHash('md5')
                .update(+new Date)
                .digest('hex')
                .substring(0,6);
            var model = models.cache.get(req.param('model'), id);
            model.set(req.body);
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
                model.save(req.body, {
                    success: function(model, resp) { res.send(model.toJSON()) },
                    error: function(model, resp) { res.send(resp, 500); }
                });
            }
        }
    });

    /**
     * DELETE a model.
     */
    app.del('/api/:model/:id', function(req, res, next) {
        if (typeof models[req.param('model')] !== 'undefined') {
            var model = models.cache.get(req.param('model'), req.param('id'));
            model.trigger('delete');
            model.destroy({
                success: function(model, resp) { res.send({}) },
                error: function(model, resp) { res.send(resp, 500); }
            });
            models.cache.del(req.param('model'), req.param('id'));
        }
    });

    /**
     * Inspect abilities.
     */
    app.get('/api/abilities', function(req, res) {
        var mapnik = require('mapnik');
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
};

