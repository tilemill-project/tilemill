var Step = require('step'),
    Pool = require('generic-pool').Pool,
    Worker = require('worker').Worker,
    fs = require('fs'),
    path = require('path');

// Export
// ------
// Implement custom sync method for Export model. Removes any files associated
// with the export model at `filename` when a model is destroyed.
var workers = [];
var pool = Pool({
    create: function(callback) {
        callback(null, new Worker(require.resolve('./export-worker.js')));
    },
    destroy: function(worker) {
        worker.terminate();
    },
    max: 3,
    idleTimeoutMillis: 5000
});

models.Export.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'delete':
        Step(function() {
            Backbone.sync('read', model, this, this);
        },
        function(data) {
            if (data && data.filename) {
                var filepath = path.join(settings.export_dir, data.filename);
                path.exists(filepath, function(exists) {
                    exists && fs.unlink(filepath, this) || this();
                }.bind(this));
            } else {
                this(false);
            }
        },
        function() {
            Backbone.sync(method, model, success, error);
        });
        break;
    case 'read':
        Backbone.sync('read', model, function(data) {
            if (data.status === 'processing' && !workers[model.id]) {
                data.status = 'error';
                data.error = 'Export did not complete.';
            }
            success(data);
        }, error);
        break;
    case 'create':
    case 'update':
        model.get('status') === 'waiting' && model.process();
        Backbone.sync(method, model, success, error);
        break;
    }
};

models.Export.prototype.process = function() {
    var model = this;
    pool.acquire(function(err, worker) {
        if (err) return callback(err);
        workers[model.id] = worker;
        worker.on('message', function(data) {
            if (data.event === 'complete') {
                worker.removeAllListeners('message');
                pool.release(worker);
            } else if (data.event === 'update') {
                model.save(data.attributes);
            }
        });
        worker.postMessage(_(model.toJSON()).extend({
            datasource: path.join(
                settings.files,
                'project',
                model.get('project'),
                model.get('project') + '.mml'
            )
        }));
    });
};
