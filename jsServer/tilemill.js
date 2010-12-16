require.paths.unshift(__dirname + '/lib/node');

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    _ = require('./underscore')._;

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

app.get('/api/list', function(req, res) {
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

var rmRf = function(dir, callback) {
  fs.readdir(dir, function(err, files) {
    files.forEach(function(file) {
      fs.stat(path.join(dir, file), function(err, stats) {
        if (stats.isDirectory()) {
          rmRf(file);
        } else {
          fs.unlink(path.join(dir, file), function(err) { });
        }
      });
    });
  });
  callback && callback();
};

app.post('/api/file', function(req, res) {
  if ((req.param('method') || 'put') == 'put') {
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
    }
  } else {
    // TODO: nodejs doesn't provide rm-rf functionality
    rmRf(path.join(settings.files, req.body.filename), function() {
        res.send({
            status: true
        });
    });
  }
});

// TODO: use watchfile
app.get('/api/mtime', function(req, res) {
  var filename = req.param('filename');
  if (path.exists(req.param('filename'))) {
    fs.stat(req.param('filename'), function(err, stats) {
      res.send(Object('' + stats.mtime));
    });
  } else {
    res.send({
      status: false,
      data: 'The file (' +
        req.param('filename') +
        ') could not be found.'
    });
  }
});

require('./providers/providers')(app, settings);

app.listen(settings.port);
