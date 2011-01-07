require.paths.unshift(__dirname + '/lib/node');

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    rmrf = require('./rm-rf'),
    Step = require('step'),
    mess = require('mess'),
    events = require('events'),
    _ = require('underscore')._;

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

app.get('/api/project/:projectId?', loadProjects, function(req, res, next) {
    if (req.param('projectId')) {
        res.send(res.projects.pop());
    }
    else {
        res.send(res.projects);
    }
});

app.put('/api/project/:projectId', function(req, res, next) {
    var project = new Project(req.body);
    project.validate(project.Stylesheet, function(err, tree) {
        if (!err) {
            project.save(function(err) {
                project.load(function(err, project) {
                    res.send(project);
                });
            });
        } else {
            res.send(err, 500);
        }
    });
});

app.post('/api/project/:projectId', function(req, res, next) {
    var project = new Project(req.body);
    project.save(function(err) {
        project.load(function(err, project) {
            res.send(project);
        });
    });
});

app.del('/api/project/:projectId', loadProjects, function(req, res, next) {
    var project = res.projects.pop();
    project.delete(function() {
        res.send({});
    });
});

/**
 * Project model.
 */
var Project = function(object) {
    this.srs = '';
    this.Stylesheet = [];
    this.Layer = [];
    _.extend(this, object);
};

Project.prototype.validate = function(stylesheets, callback) {
    Step(
        function() {
            var group = this.group();
            _.each(stylesheets, function(stylesheet) {
                new(mess.Parser)({
                    filename: stylesheet.id
                }).parse(stylesheet.data, function(err, tree) {
                    try {
                        tree.toCSS({ compress: false });
                        group()(null);
                    } catch (e) {
                        group()(e);
                    }
                });
            });
        },
        function(err, res) {
            callback(err);
        }
    );
};

Project.prototype.load = function(callback) {
    var self = this;
    var projectPath = path.join(settings.files, 'project', this.id);
    fs.readFile(path.join(projectPath, self.id + '.mml'),
    'utf-8',
    function(err, data) {
        if (err || !data) {
            return callback(new Error('Error reading project file.'));
        }
        var object = JSON.parse(data);
        if (data && object) {
            _.extend(self, object);
        }
        if (self.Stylesheet && self.Stylesheet.length > 0) {
            var queue = new events.EventEmitter;
            var queueLength = self.Stylesheet.length;
            _.each(self.Stylesheet, function(filename, key) {
                fs.readFile(path.join(projectPath, filename),
                'utf-8',
                function(err, data) {
                    self.Stylesheet[key] = {
                        id: filename,
                        data: data
                    };
                    queueLength--;
                    if (queueLength === 0) {
                        queue.emit('complete');
                    }
                });
            });
            queue.on('complete', function() {
                callback(null, self);
            });
        }
        else {
            callback(err, self);
        }
    });
};

Project.prototype.save = function(callback) {
    var self = this;
    var projectPath = path.join(settings.files, 'project', this.id);

    rmrf(projectPath, function() {
        fs.mkdir(projectPath, 0777, function() {
            var data = _.extend({}, self);
            var files = [];
            if (data.id) {
                delete data.id;
            }
            if (data.Stylesheet) {
                _.each(data.Stylesheet, function(stylesheet, key) {
                    if (stylesheet.id) {
                        files.push({
                            filename: stylesheet.id,
                            data: stylesheet.data
                        });
                        data.Stylesheet[key] = stylesheet.id;
                    }
                });
            }
            files.push({
                filename: self.id + '.mml',
                data: JSON.stringify(data)
            });

            var queue = new events.EventEmitter;
            var queueLength = files.length;
            for (var i = 0; i < files.length; i++) {
                // @TODO work through stylesheet queue and save each one individually.
                fs.writeFile(path.join(projectPath, files[i].filename), files[i].data, function(err) {
                    queueLength--;
                    if (queueLength === 0) {
                        queue.emit('complete');
                    }
                });
            }
            queue.on('complete', callback);
        });
    });
}

Project.prototype.delete = function(callback) {
    var projectPath = path.join(settings.files, 'project', this.id);
    rmrf(projectPath, callback);
};

function loadProjects(req, res, next) {
    res.projects = [];
    if (req.param('projectId')) {
        var project = new Project({id: req.param('projectId') });
        project.load(function(err, project) {
            if (project) {
                res.projects.push(project);
                next();
            }
            else {
                next(err);
            }
        });
    }
    else {
        var queue = new events.EventEmitter;
        var basepath = path.join(settings.files, 'project');
        path.exists(basepath, function(exists) {
            if (!exists) fs.mkdirSync(basepath, 0777);
            fs.readdir(basepath, function(err, projects) {
                if (err) {
                    return next(new Error('Error reading projects directory.'));
                }
                else if (projects.length === 0) {
                    next();
                }
                var queueLength = projects.length;
                for (var i = 0; i < projects.length; i++) {
                    var project = new Project({id: projects[i] });
                    project.load(function(err, project) {
                        if (!err) {
                            res.projects.push(project);
                        }
                        queueLength--;
                        if (queueLength === 0) {
                            queue.emit('complete');
                        }
                    });
                }
            });
        });
        queue.on('complete', next);
    }
}

require('./providers/providers')(app, settings);
require('./inspect')(app, settings);

// Note that tilehandler must come last as its route rule acts as a "catchall"
// @TODO: Either prefix the tile endpoint or come up with some other method of
// allowing better route handling.
require('./tilehandler')(app, settings);

// "Bootstrap" (aka install) the application.
require('./bootstrap')(app, settings);

app.listen(settings.port);
