var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    wrench = require('wrench'),
    _ = require('./underscore')._;

var app = module.exports = express.createServer();

app.use(express.bodyDecoder());

var files = '/Users/tmcw/Code/js/TileMill/project/'; // TODO: put in config

function jsonp(obj, req) {
  return req.param('jsoncallback') ?
    (req.param('jsoncallback') + '(' + JSON.stringify(obj) + ')') :
    obj;
}

function safePath(path) {
}

app.get('/', function(req, res, params) {
  res.send({
    api: 'basic',
    version: 1.0
  });
});

app.get('/list', function(req, res) {
  res.send(
    jsonp({
      status: true,
      data: _.select(fs.readdirSync(path.join(files, req.param('filename'))),
        function(dir) {
          // directories that contain at least one MML file
          return _.any(
            fs.readdirSync(path.join(files, req.param('filename'), dir)),
            function(filename) {
              return filename.match('.mml');
            }
          );
        }
      )
    }, req)
  );
});

app.get('/file', function(req, res) {
  fs.readFile(path.join(files, req.param('filename')), function(err, data) {
    if (!err) {
      res.send(jsonp('' + data, req));
    }
    else {
      res.send(jsonp({
        status: false,
        data: 'The file (' + req.param('filename') +
          ') could not be found. Exception: ' + err
      }, req));
    }
  });
});

app.post('/file', function(req, res) {
  if ((req.param('method') || 'put') == 'put') {
    if (path.dirname(req.body.filename)) {
      fs.mkdir(
          path.join(
              files,
              path.dirname(path.join(req.body.filename))),
          0777,
      function() {
        fs.writeFile(
            path.join(files, req.body.filename),
            req.body.data,
            function() {
          res.send(jsonp({
            status: true
          }, req));
        });
      });
    }
  } else {
    // TODO: nodejs doesn't provide rm-rf functionality
    wrench.rmdirRecursive(
      path.join(files, req.body.filename),
      function() {
        res.send(jsonp({ status: true }, req));
      }
    );
  }
});

// TODO: use watchfile
app.get('/mtime', function(req, res) {
  var path = req.param('filename');
  try {
    fs.stat(path, function(err, stats) {
      res.send(jsonp('' + stats.mtime, req));
    });
  }
  catch (Exception) {
    res.send(jsonp({
      status: false,
      data: 'The file (' +
        req.param('filename') +
        ') could not be found. Exception: ' +
        Exception
    }, req));
  }
});

app.listen(8889);
