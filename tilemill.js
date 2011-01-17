require.paths.unshift(__dirname + '/lib/node');

var express = require('express'),
    Project = require('./project').Project,
    ProjectList = require('./project').ProjectList,
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

app.get('/api/project/:projectId?', function(req, res, next) {
    if (req.param('projectId')) {
        var project = new Project({ id: req.param('projectId') });
        project.fetch({
            success: function(model, resp) { res.send(model.toJSON()) },
            error: function(model, resp) { res.send(resp, 500); }
        });
    }
    else {
        var list = new ProjectList();
        list.fetch({
            success: function(coll, resp) { res.send(coll.toJSON()) },
            error: function(coll, resp) { res.send(resp, 500) }
        });
    }
});

app.put('/api/project/:projectId', function(req, res, next) {
    var project = new Project(req.body);
    project.validateAsync({
        success: function(project) {
            project.save(req.body, {
                success: function(model, resp) { res.send(model.toJSON()) },
                error: function(model, resp) { res.send(resp, 500); }
            });
        },
        error: function(project, resp) {
            res.send(resp, 500);
        }
    });
});

app.post('/api/project/:projectId', function(req, res, next) {
    var project = new Project(req.body);
    project.validateAsync({
        success: function(project) {
            project.save(req.body, {
                success: function(model, resp) { res.send(model.toJSON()) },
                error: function(model, resp) { res.send(resp, 500); }
            });
        },
        error: function(project, resp) {
            res.send(resp, 500);
        }
    });
});

app.del('/api/project/:projectId', function(req, res, next) {
    var project = new Project({ id: req.param('projectId') });
    project.destroy({
        success: function(model, resp) { res.send({}) },
        error: function(model, resp) { res.send(resp, 500); }
    });
});

app.error(function(err, req, res){
    res.send(err, 500);
});

require('./providers/providers')(app, settings);
require('./inspect')(app, settings);

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
