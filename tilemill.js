require.paths.unshift(__dirname + '/lib/node');

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    rmrf = require('./rm-rf'),
    events = require('events'),
    _ = require('underscore')._;

var settings = require('./settings');
var app = module.exports = express.createServer();

app.use(express.bodyDecoder());
app.use(express.methodOverride());
app.use(express.staticProvider('client'));
app.set('jsonp callback', true);

app.get('/api', function(req, res, params) {
  res.send({
    api: 'basic',
    version: 1.0
  });
});

app.get('/api/project/:projectId?', loadProjectRoute, function(req, res, next) {
    if (req.param('projectId')) {
        res.send(res.project.pop());
    }
    else {
        res.send(res.project);
    }
});

app.put('/api/project/:projectId', function(req, res, next) {
    var project = req.body;
});

app.del('/api/project/:projectId', loadProjectRoute, function(req, res, next) {
    var basepath = path.join(settings.files, 'project');
    var projectId = res.project.pop().id;
    var projectPath = path.join(basepath, projectId);
    rmrf(projectPath, function() {
        res.send({});
    });
});

function loadProject(projectId, callback) {
    var basepath = path.join(settings.files, 'project');
    var projectPath = path.join(basepath, projectId, projectId + '.mml');
    fs.readFile(projectPath, 'utf-8', function(err, data) {
        if (!err) {
            callback(err, { id: projectId, data: data });
        }
        else {
            callback(err);
        }
    });
}

function loadProjectRoute(req, res, next) {
    res.project = [];
    if (req.param('projectId')) {
        loadProject(req.param('projectId'), function(err, project) {
            if (project) {
                res.project.push(project);
            }
            next();
        });
    }
    else {
        var queue = new events.EventEmitter;
        var basepath = path.join(settings.files, 'project');
        fs.readdir(basepath, function(err, projects) {
            if (err) {
                return next(new Error('Error reading projects directory.'));
            }
            else if (projects.length === 0) {
                next();
            }
            var queueLength = projects.length;
            for (var i = 0; i < projects.length; i++) {
                loadProject(projects[i], function(err, project) {
                    if (!err) {
                        res.project.push(project);
                    }
                    queueLength--;
                    if (queueLength === 0) {
                        queue.emit('complete');
                    }
                });
            }
        });
        queue.on('complete', next);
    }
}

app.get('/api/list', function(req, res) {
  path.exists(settings.files,
    function(exists) {
      if (exists) {
        path.exists(path.join(settings.files, req.param('filename')),
          function(exists) {
            if (!exists) fs.mkdirSync(path.join(settings.files, req.param('filename')), 0777);
            res.send({
              status: true,
              data: _.select(fs.readdirSync(
                path.join(
                  settings.files,
                  req.param('filename'))),
                function(dir) {
                  // directories that contain at least one MML file
                  return _.any(
                    fs.readdirSync(path.join(
                      settings.files,
                      req.param('filename'),
                      dir)),
                    function(filename) {
                      return filename.match('.mml');
                    }
                  );
                }
              )
            });
          });
      } else {
        res.send({
          status: false,
          data: 'The directory where TileMill keeps files is not present. ' + 
            'Please create the directory ' + settings.files
        });
      }
  });
});

app.get('/api/file', function(req, res) {
  fs.readFile(path.join(settings.files, req.param('filename')), function(err, data) {
    if (!err) {
      if (req.param('callback')) {
        res.send(Object('' + data));
      } else {
        // send non-json version if callback not given.
        res.send('' + data);
      }
    }
    else {
      res.send({
        status: false,
        data: 'The file (' + req.param('filename') +
          ') could not be found. Exception: ' + err
      });
    }
  });
});

app.post('/api/file', function(req, res) {
  if ((req.param('method') || 'put') == 'put') {
      console.log('here');
    if ((req.body.filename.split('/').length < 4) &&
        /^[a-z0-9\.\/\-_]+$/i.test(req.body.filename)) {
        console.log('true');
      if (path.dirname(req.body.filename)) {
        fs.mkdir(
          path.join(
            settings.files,
            path.dirname(path.join(req.body.filename))),
          0777,
        function() {
          fs.writeFile(
              path.join(settings.files, req.body.filename),
              req.body.data,
              function() {
            res.send({
              status: true
            });
          });
        });
      } else {
          console.log('false');
      }
    } else {
      res.send({status: false});
    }
  } else {
    // TODO: nodejs doesn't provide rm-rf functionality
    rmrf(path.join(settings.files, req.body.filename), function() {
        res.send({
            status: true
        });
    });
  }
});

// TODO: use watchfile
app.get('/api/mtime', function(req, res) {
  var filename = req.param('filename');
  path.exists(path.join(settings.files, req.param('filename')),
    function (exists) {
      if (!exists) {
        res.send({
          status: false,
          data: 'The file (' +
            path.join(settings.files, req.param('filename')) +
            ') could not be found.'
        });
      } else {
        fs.stat(path.join(
            settings.files,
            req.param('filename')), function(err, stats) {
          res.send({
            mtime: '' + stats.mtime,
            filename: req.param('filename')
          });
        });
      }
    });
});

require('./providers/providers')(app, settings);
require('./inspect')(app, settings);

// Note that tilehandler must come last as its route rule acts as a "catchall"
// @TODO: Either prefix the tile endpoint or come up with some other method of
// allowing better route handling.
require('./tilehandler')(app, settings);

// "Bootstrap" (aka install) the application.
require('./bootstrap')(app, settings);

app.listen(settings.port);
