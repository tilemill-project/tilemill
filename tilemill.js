require.paths.unshift(__dirname + '/lib/node');

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    rmrf = require('./rm-rf'),
    Step = require('step'),
    mess = require('mess'),
    events = require('events'),
    _ = require('underscore')._;

var Project = require('./project').Project;
var ProjectList = require('./project').ProjectList;
var settings = require('./settings');
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
    project.save(req.body, {
        success: function(model, resp) { res.send(model.toJSON()) },
        error: function(model, resp) { res.send(resp, 500); }
    });
});

app.post('/api/project/:projectId', function(req, res, next) {
    var project = new Project(req.body);
    project.save(req.body, {
        success: function(model, resp) { res.send(model.toJSON()) },
        error: function(model, resp) { res.send(resp, 500); }
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

/*
Project.prototype.validate = function(stylesheets, callback) {
    Step(
        function() {
            var group = this.group();
            if (stylesheets.length !== 0) {
                _.each(stylesheets, function(stylesheet) {
                    new(mess.Parser)({
                        filename: stylesheet.id
                    }).parse(stylesheet.data, function(err, tree) {
                        if (!err) {
                            try {
                                tree.toCSS({ compress: false });
                                group()(null);
                            } catch (e) {
                                group()(e);
                            }
                        } else {
                            group()(err);
                        }
                    });
                });
            }
            else {
                group()(new Error('No stylesheets found.'));
            }
        },
        function(err, res) {
            callback(err);
        }
    );
};
*/

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
