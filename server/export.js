var path = require('path'),
    ExportList = require('models-server').ExportList,
    Step = require('step'),
    Queue = require('queue'),
    Worker = require('worker').Worker,
    models = require('models-server');

module.exports = function(app, settings) {
    // Add Express route rule for serving export files for download.
    app.get('/export/download/*', function(req, res, next) {
        res.sendfile(
            path.join(settings.export_dir, req.params[0]),
            function(err, path) {
                return err && next(new Error('File not found.'));
            }
        );
    });

    // Loop for scanning and processing exports. Do not process exports if
    // testing -- otherwise, tests will never finish.
    // @TODO: Set up some other mechanism for testing exports.
    if (process.env.NODE_ENV && process.env.NODE_ENV === 'test') {
        return;
    }

    var queue = new Queue();
    var scan = function() {
        Step(
            function() {
                var list = new ExportList();
                list.fetch({ success: this });
            },
            function(list) {
                var group = this.group();
                if (list.length === 0) {
                    group()();
                }
                list.each(function(model) {
                    var next = group();
                    var job = models.cache.get('Export', model.id);
                    job.fetch({ success: function() {
                        // Job is waiting to be processed. Spawn a new worker.
                        if (job.get('status') === 'waiting') {
                            job.worker = new Worker(
                                path.join(__dirname, 'export-worker.js'),
                                null,
                                { nodePath: path.join(__dirname, '..', 'bin', 'node') }
                            );
                            job.worker.on('start', function() {
                                this.postMessage(job.toJSON());
                            });
                            job.worker.on('message', function (data) {
                                if (data.event === 'complete') {
                                    this.terminate();
                                } else if (data.event === 'update') {
                                    job.save(data.attributes);
                                }
                            });
                            job.bind('delete', function() {
                                this.worker.kill();
                            });
                            queue.add(job.worker);
                            next();
                        // Job is a stale process. Mark as such.
                        } else if (job.get('status') === 'processing' && !job.worker) {
                            job.save({
                                status: 'error',
                                error: 'Export did not complete' // @TODO
                            }, { success: next, error: next });
                        // Job is complete or already processing.
                        } else {
                            next();
                        }
                    }});
                });
            },
            function() {
                setTimeout(scan, 5000);
            }
        );
    }
    scan();
}

