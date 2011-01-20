var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    tasks = require('./jobs'),
    models = require('./project'),
    Tile = require('tilelive.js').Tile,
    _ = require('underscore')._;

var mapnik = require('mapnik');
mapnik.register_datasources('/usr/local/lib/mapnik2/input');
mapnik.register_fonts('/usr/local/lib/mapnik2/fonts/');

var tq = new tasks.JobQueue();

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

    var scan = function() {
        var jobQueue = new models.ExportJobList();
        jobQueue.fetch({
            success: function(coll) {
                coll.each(function(jobModel) {
                    if (jobModel.get('status') === 'waiting') {
                        if (typeof exportMethods[jobModel.get('type')] === 'function') {
                            var task = new exportMethods[jobModel.get('type')]({
                                model: jobModel
                            })
                            tq.add(task);
                        }
                    }
                });
            }
        });
        setTimeout(scan, 5000);
    }
    scan();
}

var ExportTask = function(opts) {
    tasks.Job.call(this, opts);
    if (!opts || !opts.model) throw Error('Job model not defined.');
}

sys.inherits(ExportTask, tasks.Job);

var ExportTaskImage = function(opts) {
    ExportTask.call(this, opts);
    this.on('start', this.start);
}

sys.inherits(ExportTaskImage, ExportTask);

ExportTaskImage.prototype.start = function() {
    this.opts.model.save({status: 'processing'});

    var options = _.extend({}, this.opts.model.attributes, {
        scheme: 'tile',
        format: 'png',
        mapfile_dir: path.join(__dirname, settings.mapfile_dir),
        bbox: this.opts.model.get('bbox').split(',')
    });

    try {
        var tile = new Tile(options);
    } catch (err) {
        this.opts.model.save({
            status: 'error',
            error: 'Tile invalid: ' + err.message
        });
    }

    if (tile) {
        var that = this;
        tile.render(function(err, data) {
            if (!err) {
                var exportDir = path.join(__dirname, settings.export_dir);
                var filename = that.opts.model.get('filename');
                path.exists(path.join(exportDir, filename), function(exists) {
                    if (exists) {
                        // Add hash to filename if the file exists
                        var date = new Date();
                        filename = filename.replace(path.extname(filename), '')
                            + require('crypto').createHash('md5').update(date.getTime()).digest('hex').substring(0,6)
                            + path.extname(filename);
                    }
                    fs.writeFile(path.join(exportDir, filename), data[0], function(err) {
                        if (err) {
                            that.opts.model.save({
                                filename: filename,
                                status: 'error',
                                error: 'Error saving image: ' + err.message
                            });
                        }
                        else {
                            that.opts.model.save({
                                filename: filename,
                                status:'complete',
                                progress: 1
                            });
                        }
                        that.emit('finish');
                    });
                });
            } else {
                that.opts.model.save({
                    status: 'error',
                    error: 'Error rendering image: ' + err.message
                });
                that.emit('finish');
            }
        });
    }

}

var exportMethods = {
    ExportJobImage: ExportTaskImage,
};
