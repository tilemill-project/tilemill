var path = require('path');
var _ = require('underscore')._;

module.exports = function(app, settings) {
    var providers = {};
    for (var p in settings.providers) {
        // TODO :express better
        providers[p] = require('providers-' + p)(app, settings);
    }
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
