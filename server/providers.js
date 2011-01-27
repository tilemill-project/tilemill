var path = require('path');
var _ = require('underscore')._;
var Step = require('Step');
var Settings = require('project').Settings

module.exports = function(app, settings) {
    var providers = {};
    Step(
      function() {
        var userSettings = new Settings({ id: 'settings' });
        userSettings.fetch({ success: this, error: this });
      },
      function(userSettings) {
        // Set default path for directory provider.
        var that = this;
        if (typeof userSettings.get('directory_path') === 'undefined') {
          var dirPath = require('path').join(__dirname, '..', 'files/data');
          userSettings.save({
            directory_path: dirPath,
          }, {
            success: function(savedSettings) {
              console.log('Set default directory provider path to %s', dirPath);
              that(savedSettings);
            }
          });
        }
        else {
          this(userSettings);
        }
      },
      function(userSettings) {
        settings.providers.forEach(function(p) {
            // TODO :express better
            providers[p] = require('providers-' + p)(app, userSettings);
        })
      }
    );
    app.get('/provider', function(req, res) {
        res.send({
            status: true,
            provider: _.keys(settings.providers)
        });
    });
    /**
     * This endpoint is a backbone.js collection compatible REST endpoint
     * providing datasource model objects. The models provided are read-only
     * and cannot be created, saved or destroyed back to the server.
     */
    app.get('/provider/:provider', function(req, res) {
        if (providers[req.params.provider]) {
            providers[req.params.provider].objects(function(objects) {
                res.send(objects);
            });
        }
        else {
            // @TODO: better error handling here.
            // Currently allows graceful downgrade of missing S3 information
            // but ideally client side JS would not request for the S3 provider
            // at all if it is not enabled.
            res.send([]);
        }
    });
};
