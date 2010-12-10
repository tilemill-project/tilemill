var express = require('express'),
    fs = require('fs'),
    path = require('path'),
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

// TODO: delete as well
app.post('/file', function(req, res) {
  var data = req.body.data;
  var path = req.body.filename;
  // TODO: if (os.path.isdir(os.path.dirname(path))):
  // if (fs.statSync(path)) {
  buffer = fs.writeFile(path, data, function() {
    res.send(jsonp({
      status: true
    }, req));
  });
  // } else {
  //     res.send(jsonp({
  //         status: false,
  //         data: 'Could not write file'
  //     }, req));
  // }
});

app.del('/file', function(req, res) {
  fs.unlink(req.body.filename, function() {
    res.send(jsonp({ status: true }));
  });
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
