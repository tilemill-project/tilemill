var path = require('path'),
    ExportList = require('project').ExportList,
    Step = require('step'),
    Task = require('queue').Task,
    Queue = require('queue').Queue,
    Tile = require('tilelive.js').Tile,
    TileBatch = require('tilelive.js').TileBatch,
    fs = require('fs'),
    settings = require('settings'),
    Worker = require('worker').Worker,
    sys = require('sys'),
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
                list.each(function(model) {
                    var job = modelInstance.get('Export', model.id);
                    job.fetch({ success: function() {
                        if (job.get('status') === 'waiting') {
                            var nodePath = path.join(__dirname, '..', 'bin', 'node');
                            var worker = new Worker(
                                path.join(__dirname, 'export-worker.js'),
                                null, {nodePath: nodePath});
                            worker.on('start', function() {
                                this.postMessage({ id: job.id });
                            });
                            worker.on('message', function (msg) {
                                this.terminate();
                            });
                            job.bind('delete', function() {
                                worker.kill();
                            });
                            queue.add(worker);
                        }
                    }});
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

/**
 * Generic export class.
 */
var Export = function(model, callback) {
    this.model = model;
    this.callback = callback;
    var that = this;
    this.setup(function() {
        that.render(that.callback);
    });
}

Export.prototype.setup = function(callback) {
    var that = this;
    Step(
        function() {
            path.exists(path.join(settings.export_dir, that.model.get('filename')), this);
        },
        function(exists) {
            var filename = that.model.get('filename');
            if (exists) {
                var extension = path.extname(filename);
                var hash = require('crypto').createHash('md5')
                    .update(+new Date).digest('hex').substring(0,6);
                filename = filename.replace(extension, '') + '_' + hash + extension;
            }
            that.model.save({
                status: 'processing',
                updated: +new Date,
                filename: filename
            }, { success: callback, error: callback });
        }
    );
}

var ExportMBTiles = function(model, callback) {
    Export.call(this, model, callback);
}
sys.inherits(ExportMBTiles, Export);

ExportMBTiles.prototype.render = function(callback) {
    var batch;
    var that = this;
    var RenderTask = function() {
        process.nextTick(function() {
            batch.renderChunk(function(err, rendered) {
                if (rendered) {
                    that.model.save({
                        progress: batch.tiles_current / batch.tiles_total,
                        updated: +new Date
                    }, { success: RenderTask });
                }
                else {
                    batch.finish();
                    that.model.save({
                        status: 'complete',
                        progress: 1,
                        updated: +new Date
                    }, { success: callback });
                }
            });
        });
    }

    Step(
        function() {
            batch = new TileBatch({
                filepath: path.join(settings.export_dir, that.model.get('filename')),
                batchsize: 100,
                bbox: that.model.get('bbox').split(','),
                minzoom: that.model.get('minzoom'),
                maxzoom: that.model.get('maxzoom'),
                mapfile: that.model.get('mapfile'),
                mapfile_dir: path.join(settings.mapfile_dir),
                metadata: {
                    name: that.model.get('metadata_name'),
                    type: that.model.get('metadata_type'),
                    description: that.model.get('metadata_description'),
                    version: that.model.get('metadata_version')
                }
            });
            batch.setup(this);
        },
        function(err) {
            that.model.save({
                status: 'processing',
                updated: +new Date
            }, { success: RenderTask });
        }
    );
}

var ExportImage = function(model, callback) {
    Export.call(this, model, callback);
}
sys.inherits(ExportImage, Export);

ExportImage.prototype.render = function(callback) {
    this.format = this.format || 'png';
    var that = this;
    Step(
        function() {
            var options = _.extend({}, that.model.attributes, {
                scheme: 'tile',
                format: that.format,
                mapfile_dir: path.join(settings.mapfile_dir),
                bbox: that.model.get('bbox').split(',')
            });
            try {
                var tile = new Tile(options);
                tile.render(this);
            } catch (err) {
                var next = this;
                that.model.save({
                    status: 'error',
                    error: 'Tile invalid: ' + err.message,
                    updated: +new Date
                }, {
                    success: function() { next(err); },
                    error: function() { next(err); }
                });
            }
        },
        function(err, data) {
            if (!err) {
                fs.writeFile( path.join(settings.export_dir, that.model.get('filename')), data[0], 'binary', function(err) {
                    if (err) {
                        that.model.save({
                            status: 'error',
                            error: 'Error saving image: ' + err.message,
                            updated: +new Date
                        }, { success: callback, error: callback});
                    }
                    else {
                        that.model.save({
                            status:'complete',
                            progress: 1,
                            updated: +new Date
                        }, { success: callback, error: callback});
                    }
                });
            }
            else {
                that.model.save({
                    status: 'error',
                    error: 'Error rendering image: ' + err.message,
                    updated: +new Date
                }, { success: callback, error: callback});
            }
        }
    );
}

var ExportPDF = function(model, callback) {
    this.format = 'pdf';
    ExportImage.call(this, model, callback);
}
sys.inherits(ExportPDF, ExportImage);

module.exports = {
    ExportScanner: ExportScanner,
    doExport: function(model, callback) {
        return new {
            ExportImage: ExportImage,
            ExportPDF: ExportPDF,
            ExportMBTiles: ExportMBTiles
        }[model.get('type')](model, callback);
    }
}
