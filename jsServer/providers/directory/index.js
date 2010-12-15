var express = require('express'),
    fs = require('fs'),
    url = require('url'),
    _ = require('underscore')._,
    path = require('path');

module.exports = function(app, settings) {

  // TODO: now requires absolute paths; change?
  app.get('/provider/directory/file*', function(req, res) {
      // TODO: make path secure!
      res.sendfile(path.join(settings.providers.directory.path, req.params[0]),
          function(err, path) {
              if (err) {
                  res.send({
                      status: false
                  });
              }
      });
  });

  return {
    name: 'Local Files',
    settings: settings,
    objects: function(callback) {
      var settings = this.settings.providers.directory;
      var port = this.settings.port;
      callback(_.reduce(fs.readdirSync(path.join(settings.path)),
        function(memo, dir) {
          // directories that contain at least one MML file
          if (fs.statSync(path.join(settings.path, dir)).isDirectory()) {
            return memo.concat(
              _.map(_.select(
              fs.readdirSync(path.join(settings.path, dir)),
              function(filename) {
                return filename.match(/(.zip|.geojson)/);
              }
            ),
            function(filename) {
              return {
                url: url.format({
                  host: 'localhost:' + port,
                  protocol: 'http:',
                  pathname: path.join('/provider/directory/file/', dir, filename)
                }),
                name: path.basename(filename),
                bytes: fs.statSync(path.join(settings.path, dir, filename)).size
              }
            }));
          }
          else {
              return memo;
          }
        }
      , []));
    }
  };
};
