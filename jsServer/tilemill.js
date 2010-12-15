require.paths.unshift(__dirname + '/lib/node');

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    _ = require('./underscore')._;

var settings = require('./settings'); // TODO: put in config
var app = module.exports = express.createServer();
app.use(express.bodyDecoder());
app.set('jsonp callback', true);

app.get('/', function(req, res, params) {
  res.send({
    api: 'basic',
    version: 1.0
  });
});

app.get('/list', function(req, res) {
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

app.get('/file', function(req, res) {
  fs.readFile(path.join(settings.files, req.param('filename')), function(err, data) {
    if (!err) {
      res.send(jsonp('' + data, req));
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

app.post('/file', function(req, res) {
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
app.get('/mtime', function(req, res) {
  var path = req.param('filename');
  try {
    fs.stat(path, function(err, stats) {
      res.send('' + stats.mtime);
    });
  }
  catch (Exception) {
    res.send({
      status: false,
      data: 'The file (' +
        req.param('filename') +
        ') could not be found. Exception: ' +
        Exception
    });
  }
});

app.listen(8889);
