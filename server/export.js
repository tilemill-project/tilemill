var path = require('path'),
    ExportJobList = require('project').ExportJobList,
    Step = require('step'),
    Task = require('queue').Task,
    Queue = require('queue').Queue,
    Tile = require('tilelive.js').Tile,
    TileBatch = require('tilelive.js').TileBatch,
    fs = require('fs'),
    settings = require('settings'),
    Worker = require('worker').Worker,
    modelInstance = require('model');


var ExportScanner  = function(app, settings) {
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
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
        var queue = new Queue();
        var scan = function() {
            Step(
                function() {
                    var jobs = new ExportJobList();
                    jobs.fetch({
                        success: this
                    });
                },
                function(jobs) {
                    jobs.each(function(job) {
                        if (job.get('status') === 'waiting') {
                            modelInstance.set('ExportJob', job.id, job);
                            var task = Task();
                            var nodePath = path.join(__dirname, '..', 'bin', 'node');
                            var worker = new Worker(
                                path.join(__dirname, 'export-worker.js'),
                                null, {nodePath: nodePath});
                            worker.on('start', function() {
                                this.postMessage({
                                    id: job.id
                                });
                                this.on('message', function (msg) {
                                    worker.terminate();
                                });
                            });
                            job.bind('delete', function() {
                                worker.terminate();
                            });
                            queue.add(worker);
                        }
                    });
                    this();
                },
                function() {
                    setTimeout(scan, 5000);
                }
            );
        }
        scan();
    }
}

var ExportJobMBTiles = function(model, callback) {
    var batch;
    var RenderTask = function() {
        batch.renderChunk(function(err, rendered) {
            if (rendered) {
                model.save({
                    progress: batch.tiles_current / batch.tiles_total,
                    updated: +new Date
                });
                // Use nextTick to avoid recursion
                process.nextTick(function() {
                    RenderTask();
                });
            }
            else {
                batch.finish();
                model.save({
                    status: 'complete',
                    progress: 1,
                    updated: +new Date
                });
                callback(false);
            }
        });
    }

    Step(
        function() {
            path.exists(path.join(settings.export_dir, model.get('filename')), this);
        },
        function(exists) {
            if (exists) {
                var filename = model.get('filename');
                var extension = path.extname(filename);
                var hash = require('crypto').createHash('md5')
                    .update(+new Date).digest('hex').substring(0,6);
                model.set({
                    filename: filename.replace(extension, '') + '_' + hash + extension,
                    updated: +new Date
                });
            }
            this();
        },
        function() {
            batch = new TileBatch({
                filepath: path.join(settings.export_dir, model.get('filename')),
                batchsize: 100,
                bbox: model.get('bbox').split(','),
                minzoom: model.get('minzoom'),
                maxzoom: model.get('maxzoom'),
                mapfile: model.get('mapfile'),
                mapfile_dir: path.join(settings.mapfile_dir),
                metadata: {
                    name: model.get('metadata_name'),
                    type: model.get('metadata_type'),
                    description: model.get('metadata_description'),
                    version: model.get('metadata_version')
                }
            });
            batch.setup(this);
        },
        function(err) {
            process.nextTick(function() {
                RenderTask();
            });
            model.save({
                status: 'processing',
                updated: +new Date
            });
        }
    );
}

var ExportJobImage = function(model, callback) {
    this.format = this.format || 'png';
    var that = this;

    model.save({
        status: 'processing',
        updated: +new Date
    });

    Step(
        function() {
            path.exists(path.join(settings.export_dir, model.get('filename')), this);
        },
        function(exists) {
            if (exists) {
                var filename = model.get('filename');
                var extension = path.extname(filename);
                var hash = require('crypto').createHash('md5')
                    .update(+new Date).digest('hex').substring(0,6);
                model.set({
                    filename: filename.replace(extension, '') + '_' + hash + extension,
                    updated: +new Date
                });
            }
            this();
        },
        function() {
            var options = _.extend({}, model.attributes, {
                scheme: 'tile',
                format: that.format,
                mapfile_dir: path.join(settings.mapfile_dir),
                bbox: model.get('bbox').split(',')
            });
            try {
                var tile = new Tile(options);
            } catch (err) {
                model.save({
                    status: 'error',
                    error: 'Tile invalid: ' + err.message,
                    updated: +new Date
                });
            }
            if (tile) {
                tile.render(this);
            }
        },
        function(err, data) {
            if (!err) {
                fs.writeFile( path.join(settings.export_dir, model.get('filename')), data[0], 'binary', function(err) {
                    if (err) {
                        model.save({
                            status: 'error',
                            error: 'Error saving image: ' + err.message,
                            updated: +new Date
                        });
                        callback(true);
                        
                    }
                    else {
                        model.save({
                            status:'complete',
                            progress: 1,
                            updated: +new Date
                        });
                        callback(false);
                    }
                });
            }
            else {
                model.save({
                    status: 'error',
                    error: 'Error rendering image: ' + err.message,
                    updated: +new Date
                });
                callback(true);
            }
        }
    );
}

var ExportJobPDF = function(model, callback) {
    this.format = 'pdf';
    ExportJobImage.call(this, model, callback);
}

module.exports = {
    ExportScanner: ExportScanner,
    doExport: function(model, callback) {
        return {
            ExportJobImage: ExportJobImage,
            ExportJobPDF: ExportJobPDF,
            ExportJobMBTiles: ExportJobMBTiles
        }[model.get('type')](model, callback);
    }
}
