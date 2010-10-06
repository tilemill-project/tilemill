var express = require('express'), fs = require('fs');
var _ = require('./underscore')._;
var app = module.exports = express.createServer();
var files = 'project'; // TODO: put in config

function jsonp(obj, req) {
  return req.param('jsoncallback') + '(' + JSON.stringify(obj) + ')';
}

function safePath(path) {
  // return True or path.find('..') == -1 and not re.search('[^\w.-_\/]', path)
}

app.get('/', function(req, res, params) {
  res.send({'api':'basic','version':1.0});
});

app.get('/list', function(req, res) {
  res.send(
    jsonp({
      'status': true,
      'data': _.select(fs.readdirSync(files),
        function(dir) {
          return _.any(
            fs.readdirSync(files + '/' + dir),
            function(filename) {
              return filename.match('.mml') 
            }
          )
        }
      )
    }, req)
  );
});

app.get('/file', function(req, res) {
  var path = req.param('filename');
  try {
    fs.readFile(path, function(err, data) {
      res.send(jsonp("" + data, req));
    })
  }
  catch(Exception) {
    res.send(jsonp(
    {
        'status':false, 
        'data':'The file (' + req.param('filename') + 
      ') could not be found. Exception: ' + Exception
    }, req))
  }
});

/*
app.post('/file', function(req, res) {
  path = os.path.join(options.files, self.get_argument('filename'))
  //if (self.safePath(path)):
  method = req.param('method')
  data = req.param('data')
  if (method == 'delete') {
    this.rm(path);
    res.send(jsonp({ 'status': True }, req))
  }
  else {
    // if (os.path.isdir(os.path.dirname(path))):
    // os.makedirs(os.path.dirname(path))
    if (fs.fstatSync(path))) {
      buffer = fs.writeFile(path, data, 
        function() {
          res.send(jsonp({ 'status': true }, req))
        }
      )
    }
    else {
      res.send(jsonp(
      {
        'status': False, 
        'data': 'Could not write file'
      }, req)
      )
    }
  }
}
*/

app.get('/mtime', function(req, res) {
  var path = req.param('filename');
  try {
    fs.stat(path, function(err, stats) {
      res.send(jsonp("" + stats.mtime, req));
    });
  }
  catch(Exception) {
    res.send(jsonp(
    {
        'status':false, 
        'data':'The file (' + req.param('filename') + 
      ') could not be found. Exception: ' + Exception
    }, req))
  }
});

app.listen(8889);
