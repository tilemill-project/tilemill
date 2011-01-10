var _ = require('underscore')._;

/**
 * Map loader, express route middleware.
 */
function loadMap(req, res, next) {
    if (req.param('mapfile_64')) {
        var path = require('path');
        var Map = require('tilelive.js').Map;
        var map = new Map(req.param('mapfile_64'), path.join(__dirname, settings.mapfile_dir), true);
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
 * Layer loader, express route middleware.
 */
function loadLayer(req, res, next) {
    res.layers = [];
    var layers = res.map.layers();
    var data = res.map.describe_data();
    for (var i = 0; i < layers.length; i++) {
        var layer = {
            id: layers[i].datasource.id,
        };
        if (data[layer.id]) {
            _.extend(layer, data[layer.id]);
        }
        if (layer.fields) {
            for (var field in layer.fields) {
                layer.fields[field] = {
                    type: layer.fields[field],
                    values: [],
                };
            }
            var values = res.map.features(i);
            for (var j = 0; j < values.length; j++) {
                for (var field in values[j]) {
                    var layerValues = layer.fields[field].values;
                    var fieldValue = values[j][field];
                    if (
                        _.indexOf(layerValues, fieldValue)  === -1 &&
                        fieldValue !== ''
                    ) {
                        layerValues.push(fieldValue);
                    }
                }
            }
            for (var field in layer.fields) {
                if (layer.fields[field].values.length) {
                    if (layer.fields[field].type === 'Number') {
                        layer.fields[field].min = _.min(
                            layer.fields[field].values,
                            function(object) { return object; }
                        );
                        layer.fields[field].max = _.max(
                            layer.fields[field].values,
                            function(object) { return object; }
                        );
                    }
                    else if (layer.fields[field].type === 'String') {
                        layer.fields[field].min = _.min(
                            layer.fields[field].values,
                            function(object) { return object.length; }
                        );
                        layer.fields[field].max = _.max(
                            layer.fields[field].values,
                            function(object) { return object.length; }
                        );
                    }
                }
            }
        }

        if (!req.param('layer_id')) {
            res.layers.push(layer);
        }
        else if (req.param('layer_id') === layer.id) {
            res.layers.push(layer);
        }
    }
    if (req.param('layer_id') && res.layers.length === 0) {
        next(new Error('Layer could not be loaded.'));
    }
    next();
}

module.exports = function(app, settings) {
    /**
     * Inspect abilities.
     */
    app.get('/abilities', function(req, res) {
        var mapnik = require('mapnik');
        res.send(
            {
                fonts: mapnik.fonts(),
                datasources: mapnik.datasources()
            }
        );
    });

    /**
     * Load layer model.
     */
    app.get('/:mapfile_64/:layer_id?', loadMap, loadLayer, function(req, res, next) {
        if (req.param('layer_id')) {
            res.send(res.layers.pop());
        }
        else {
            res.send(res.layers);
        }
    });

    /**
     * @TODO datasource SRS autodetection endpoint.
     */
    /*
    app.get('/:datasource_64', loadDatasource, function(req, res, next) {
        res.send({});
    });
    */
};
