module.exports = function(app, settings) {
    app.get('/status.json', function(req, res) {
        res.send({ status: 'true' });
    });

    /**
     * Inspect fields
     */
    app.get('/:mapfile_64/fields.json', function(req, res) {
    });

    /**
     * Inspect data
     */
    app.get('/:mapfile_64/data.json', function(req, res) {
    });

    /**
     * Inspect layer
     */
    app.get('/:mapfile_64/:layer_64/layer.json', function(req, res) {
    });

    /**
     * Inspect field values
     */
    app.get('/:mapfile_64/:layer_64/:feature_64/values.json', function(req, res) {
    });
}

