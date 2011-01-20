require.paths.unshift(__dirname + '/lib/node');

var express = require('express'),
    models = require('./project');
    settings = require('./settings');

var app = module.exports = express.createServer();

app.use(express.bodyDecoder());
app.use(express.methodOverride());
app.use(express.staticProvider('client'));

app.get('/api', function(req, res, params) {
  res.send({
    api: 'basic',
    version: 1.0
  });
});

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

app.del('/api/:model/:id', function(req, res, next) {
    if (typeof models[req.param('model')] !== 'undefined') {
        var model = new models[req.param('model')]({ id: req.param('id') });
        model.destroy({
            success: function(model, resp) { res.send({}) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    }
});

app.error(function(err, req, res){
    res.send(err, 500);
});

require('./providers/providers')(app, settings);
require('./inspect')(app, settings);
require('./export')(app, settings);

// Note that tilehandler must come last as its route rule acts as a "catchall"
// @TODO: Either prefix the tile endpoint or come up with some other method of
// allowing better route handling.
require('./tilehandler')(app, settings);

// "Bootstrap" (aka install) the application.
require('./bootstrap')(app, settings);

if (app.settings.env !== 'test') {
    app.listen(settings.port);
    console.log('Started TileMill on port %d.', settings.port);
}
