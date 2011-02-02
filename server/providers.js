var path = require('path');
var _ = require('underscore')._;
var Step = require('step');
var models = require('models-server');
var Settings = require('models-server').Settings;

module.exports = function(app, settings) {
    /**
     * This endpoint is a backbone.js collection compatible REST endpoint
     * providing datasource model objects. The models provided are read-only
     * and cannot be created, saved or destroyed back to the server.
     */
    app.get('/api/Provider/:id/assets', function(req, res) {
        if (req.param('id')) {
            var model = models.cache.get('Provider', req.param('id'));
            model.fetch({
                success: function(model, resp) {
                    var type = model.get('type');
                    require('providers-' + type)(
                        app,
                        model.toJSON(),
                        function(assets) {
                            res.send(assets);
                        }
                    );
                },
                error: function(model, resp) {
                    res.send([]);
                }
            });
        }
    });
};
