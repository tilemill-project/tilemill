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

app.get('/api/list', function(req, res) {
  path.exists(settings.files,
    function(exists) {
      if (exists) {
        path.exists(path.join(settings.files, req.param('filename')),
          function(exists) {
            if (!exists) fs.mkdirSync(path.join(settings.files, req.param('filename')), 777);
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
