var path = require('path');
var _ = require('underscore')._;

module.exports = function(app, settings) {
  var providers = {};
  for (var p in settings.providers) {
      // TODO :express better
      providers[p] = require('./' + path.join(p, 'index'))(app, settings);
  }
  app.get('/provider', function(req, res) {
      res.send({
          status: true,
          provider: _.keys(settings.providers)
      });
  });
  app.get('/provider/:provider', function(req, res) {
      providers[req.params.provider].objects(function(objects) {
          res.send(objects);
      });
  });
};
