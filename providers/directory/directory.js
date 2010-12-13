var express = require('express'),
    fs = require('fs'),
    url = require('url'),
    _ = require('underscore')._,
    path = require('path');

var app = module.exports = express.createServer();
var data_dir = 'data';
var PORT = 8891;

app.use(express.bodyDecoder());
app.use(express.staticProvider(__dirname + '/data'));

function jsonp(obj, req) {
  return req.param('jsoncallback') ?
    (req.param('jsoncallback') + '(' + JSON.stringify(obj) + ')') :
    obj;
}

app.get('/', function(req, res, params) {
  res.send(jsonp({
    name: 'Local',
    version: 1.0,
    datasources: _.reduce(fs.readdirSync(path.join(__dirname, data_dir)),
      function(memo, dir) {
        // directories that contain at least one MML file
        return memo.concat(
          _.map(_.select(
          fs.readdirSync(path.join(__dirname, data_dir, dir)),
          function(filename) {
            return filename.match(/(.zip|.geojson)/);
          }
        ),
        function(filename) {
          return {
            url: url.format({
              host: 'localhost:' + PORT,
              protocol: 'http:',
              pathname: path.join(dir, filename)
            }),
            name: path.basename(filename),
            bytes: fs.statSync(path.join(__dirname, data_dir, dir, filename)).size
          }
        }));
      }
    , [])
  }, req));
});

app.listen(PORT);
