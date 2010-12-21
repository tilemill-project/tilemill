require.paths.unshift(__dirname + '/lib/node');

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    rmrf = require('./rm-rf'),
    _ = require('underscore')._;

var settings = JSON.parse(fs.readFileSync('settings.json'));
var app = module.exports = express.createServer();

app.use(express.bodyDecoder());
app.use(express.staticProvider('../client'));
app.set('jsonp callback', true);

app.get('/api', function(req, res, params) {
  res.send({
    api: 'basic',
    version: 1.0
  });
});

app.get('/api/projects', function(req, res) {
  res.send(
    _.map(
      _.select(
        fs.readdirSync(
          path.join(settings.files, 'project')
        ),
        function(dir) {
          return _.any(
            fs.readdirSync(path.join(
              settings.files,
              'project',
              dir)
            ),
            function(filename) { return filename.match('.mml'); }
          )
        }
      ),
      function(project) {
        return {
          id: project
        }
      }
    )
  )
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

app.listen(settings.port);
