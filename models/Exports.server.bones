var Step = require('step'),
    Pool = require('generic-pool').Pool,
    Worker = require('worker').Worker,
    fs = require('fs'),
    path = require('path'),
    settings = Bones.plugin.config,
    workerPath = require.resolve('../lib/export-worker.js');

// Export
// ------
// Implement custom sync method for Export model. Removes any files associated
// with the export model at `filename` when a model is destroyed.
var workers = {};
var pool = Pool({
    create: function(callback) {
        callback(null, new Worker(workerPath));
    },
    destroy: function(worker) {
        worker.removeAllListeners('message');
        worker.terminate();
    },
    max: 3,
    idleTimeoutMillis: 5000
});

models.Export.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'delete':
        // Destroy worker if exists.
        if (workers[model.id]) pool.destroy(workers[model.id]);

        Step(function() {
            Backbone.sync('read', model, this, this);
        },
        function(data) {
            if (data && data.filename) {
                var filepath = path.join(settings['export'], data.filename);
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
            ),
            filepath: path.join(
                settings['export'],
                model.get('filename')
            )
        }));
    });
};

models.Exports.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        Backbone.sync('read', model, function(exports) {
            _(exports).each(function(data) {
                if (data.status === 'processing' && !workers[data.id]) {
                    data.status = 'error';
                    data.error = 'Export did not complete.';
                }
            });
            success(exports);
        }, error);
        break;
    }
};

