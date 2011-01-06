module.exports = function(app, settings) {
    /**
     * Map loader, express route middleware.
     */
    function loadMap(req, res, next) {
        if (req.param('mapfile_64')) {
            var Map = require('tilelive.js').Map;
            var map = new Map(req.param('mapfile_64'), settings.mapfile_dir, true);
            map.localize(function() {
                res.map = map.mapnik_map();
                next();
            });
        }
        else {
            next(new Error('Map could not be loaded.'));
        }
    }

    /**
     * @TODO: Implement once node-mapnik exposes layers.
     * Layer loader, express route middleware.
     */
    function loadLayer(req, res, next) {
        if (req.param('layer_64')) {
            next();
        }
        else {
            next(new Error('Layer could not be loaded.'));
        }
    }

    /**
     * @TODO: Implement once node-mapnik exposes layers.
     * Feature loader, express route middleware.
     */
    function loadFeature(req, res, next) {
        if (req.param('feature_64')) {
            next();
        }
        else {
            next(new Error('Feature could not be loaded.'));
        }
    }

    app.get('/status.json', function(req, res) {
        res.send({ status: 'true' });
    });

    /**
     * Inspect abilities.
     */
    app.get('/abilities', function(req, res) {
        mapnik = require('mapnik');
        res.send(
            {
                fonts: mapnik.fonts(),
                datasources: mapnik.datasources()
            }
        );
    });

    /**
     * Inspect fields
     */
    app.get('/:mapfile_64/fields.json', loadMap, function(req, res, next) {
        res.send({});
    });

    /**
     * Inspect data
     */
    app.get('/:mapfile_64/data.json', loadMap, function(req, res, next) {
        res.send({});
    });

    /**
     * Inspect layer
     */
    app.get('/:mapfile_64/:layer_64/layer.json', loadMap, loadLayer, function(req, res, next) {
        res.send({});
    });

    /**
     * Inspect field values
     */
    app.get('/:mapfile_64/:layer_64/:feature_64/values.json', loadMap, loadLayer, loadFeature, function(req, res, next) {
        res.send({});
    });
};
