// Loop for scanning and processing exports.
var path = require('path'),
    ExportList = require('models-server').ExportList,
    Step = require('step'),
    Worker = require('worker').Worker,
    models = require('models-server');

var Scanner = function(options) {
    _.bindAll(this, 'scan', 'process', 'add', 'remove', 'isFull');
    this.options = options || {};
    this.options.interval = this.options.interval || 1000;
    this.options.limit = this.options.limit || 5;
    this.workers = [];
};

// A single scan that fetches the `ExportList` and passes each off for
// processing. When complete, calls itself again after `options.interval`
// has passed to continue the loop.
Scanner.prototype.scan = function() {
    var that = this;
    Step(
        function() {
            (new ExportList()).fetch({
                success: this,
                error: this
            });
        },
        function(list) {
            if (list.length === 0) return this();
            var group = this.group();
            list.each(function(model) {
                that.process(model.id, group());
            });
        },
        function() {
            setTimeout(that.scan, that.options.interval);
        }
    );
};

// Process an individual export based on its `status`.
Scanner.prototype.process = function(id, callback) {
    var that = this;
    var model = models.cache.get('Export', id);
    model.fetch({
        success: function() {
            // Export is waiting to be processed. Spawn a new worker if the
            // queue is not full. Otherwise, the worker will be spawned on
            // a subsequent scan once there is space.
            if (model.get('status') === 'waiting') {
                if (that.isFull()) return callback();

                model.worker = new Worker(
                    path.join(__dirname, 'export-worker.js'),
                    null,
                    { nodePath: path.join(__dirname, '..', 'bin', 'node') }
                );
                model.worker.on('message', function (data) {
                    if (data.event === 'complete') {
                        this.terminate();
                        that.remove(model.worker);
                    } else if (data.event === 'update') {
                        model.save(data.attributes);
                    }
                });
                model.bind('delete', function() {
                    this.worker.kill();
                    that.remove(model.worker);
                });
                model.worker.postMessage(_.extend(
                    model.toJSON(),
                    { mapfile: model.mapfile_64() }
                ));
                that.add(model.worker);
                callback();
            // Export is a stale process (e.g. the server died or was shut
            // down before the worker completed). Mark as an incomplete export.
            } else if (model.get('status') === 'processing' && !model.worker) {
                model.save({
                    status: 'error',
                    error: 'Export did not complete'
                }, { success: callback, error: callback });
            // Model is complete or already processing.
            } else {
                callback();
            }
        },
        error: callback
    });
};

// Helper function to determine whether the queue is full.
Scanner.prototype.isFull = function() {
    return (this.workers.length >= this.options.limit);
};

// Add a worker to the queue.
Scanner.prototype.add = function(worker) {
    this.workers.push(worker);
};

// Remove a worker from the queue.
Scanner.prototype.remove = function(worker) {
    this.workers = _.reject(this.workers, function(w) {
        return (worker === w);
    });
};

module.exports = function(app, settings) {
    // Do not process exports if testing -- otherwise, tests will never finish.
    // @TODO: Set up some other mechanism for testing exports.
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
        (new Scanner()).scan();
    }

    // Add Express route rule for serving export files for download.
    app.get('/export/download/*', function(req, res, next) {
        res.download(
            path.join(settings.export_dir, req.params[0]),
            req.params[0],
            function(err, path) {
                return err && next(new Error('File not found.'));
            }
        );
    });
}

