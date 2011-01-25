var path = require('path'),
    Queue = require('queue').Queue,
    ExportJobList = require('project').ExportJobList,
    Step = require('step'),
    Task = require('queue').Task,
    Tile = require('tilelive.js').Tile,
    TileBatch = require('tilelive.js').TileBatch,
    fs = require('fs'),
    sys = require('sys'),
    settings = require('settings'),
    events = require('events');


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
                            job.addTasks(queue);
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

var ExportJobMBTiles = function(model, queue) {
    var batch;
    var RenderTask = function(batch, model, queue) {
        events.EventEmitter.call(this);
        this.batch = batch;
        this.model = model;
        this.queue = queue;
        this.on('start', function() {
            this.emit('work');
        });
        this.on('work', function() {
            var that = this;
            this.batch.renderChunk(function(err, rendered) {
                if (rendered) {
                    var next = new RenderTask(that.batch, that.model, that.queue);
                    that.queue.add(next);
                    that.model.save({
                        progress: that.batch.tiles_current / that.batch.tiles_total,
                        updated: +new Date
                    });
                }
                else {
                    batch.finish();
                    that.model.save({
                        status: 'complete',
                        progress: 1,
                        updated: +new Date
                    });
                }
                that.emit('finish');
            });
        });
    }
    sys.inherits(RenderTask, events.EventEmitter);

    Step(
        function() {
            path.exists(path.join(settings.export_dir, model.get('filename')), this);
        },
        function(exists) {
            if (exists) {
                var filename = model.get('filename');
                var extension = path.extname(filename);
                var date = new Date();
                var hash = require('crypto')
                    .createHash('md5')
                    .update(date.getTime())
                    .digest('hex')
                    .substring(0,6);
                model.set({
                    filename: filename.replace(extension, '') + '_' + hash + extension
                });
            }
            batch = new TileBatch({
                filepath: path.join(settings.export_dir, model.get('filename')),
                batchsize: 1,
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
            queue.add(new RenderTask(batch, model, queue));
            model.save({
                status: 'processing',
                updated: +new Date
            });
        }
    );
}

var ExportJobImage = function(model, queue) {
    var task = new Task();
    task.on('start', function() {
        this.emit('work');
    });
    task.on('work', function() {
        Step(
            function() {
                path.exists(path.join(settings.export_dir, model.get('filename')), this);
            },
            function(exists) {
                if (exists) {
                    var filename = model.get('filename');
                    var extension = path.extname(filename);
                    var date = new Date();
                    var hash = require('crypto').createHash('md5')
                        .update(date.getTime()).digest('hex').substring(0,6);
                    model.set({
                        filename: filename.replace(extension, '') + '_' + hash + extension
                    });
                }
                var options = _.extend({}, model.attributes, {
                    scheme: 'tile',
                    format: 'png',
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
                    fs.writeFile(path.join(settings.export_dir, model.get('filename')), data[0], function(err) {
                        if (err) {
                            model.save({
                                status: 'error',
                                error: 'Error saving image: ' + err.message,
                                updated: +new Date
                            });
                        }
                        else {
                            model.save({
                                status:'complete',
                                progress: 1,
                                updated: +new Date
                            });
                        }
                        task.emit('finish');
                    });
                }
                else {
                    model.save({
                        status: 'error',
                        error: 'Error rendering image: ' + err.message,
                        updated: +new Date
                    });
                    task.emit('finish');
                }
            }
        );
    });
    queue.add(task);
    model.save({
        status: 'processing',
        updated: +new Date
    });
}

module.exports = {
    ExportScanner: ExportScanner,
    addTasks: function(model, queue) {
        return {
            ExportJobImage: ExportJobImage,
            ExportJobMBTiles: ExportJobMBTiles
        }[model.get('type')](model, queue);
    }
}
