var taskmanager = require('./taskmanager'),
    Step = require('step'),
    path = require('path'),
    Tile = require('tilelive.js').Tile,
    TileBatch = require('tilelive.js').TileBatch,
    fs = require('fs'),
    sys = require('sys'),
    settings = require('./settings'),
    events = require('events');

var ExportJobMBTiles = function(model, taskQueue) {
    var batch;
    var workTask = function(batch, model, taskQueue) {
        events.EventEmitter.call(this);
        this.batch = batch;
        this.model = model;
        this.taskQueue = taskQueue;
        this.on('start', function() {
            this.emit('work');
        });
        this.on('work', function() {
            var that = this;
            this.batch.renderChunk(function(err, rendered) {
                if (rendered) {
                    var next = new workTask(that.batch, that.model, that.taskQueue);
                    that.taskQueue.add(next);
                }
                else {
                    that.model.save({status: 'complete', progress: 1});
                }
                that.emit('finish');
            });
        });
    }
    sys.inherits(workTask, events.EventEmitter);

    Step(
        function() {
            path.exists(path.join(__dirname, 
                settings.export_dir, model.get('filename')), this);
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
            batch = new TileBatch({
                filepath: path.join(__dirname, settings.export_dir, model.get('filename')),
                bbox: model.get('bbox').split(','),
                minzoom: model.get('minzoom'),
                maxzoom: model.get('maxzoom'),
                mapfile: model.get('mapfile'),
                mapfile_dir: path.join(__dirname, settings.mapfile_dir)
            });
            batch.setup(this);
        },
        function(err) {
            taskQueue.add(new workTask(batch, model, taskQueue));
            model.save({status: 'processing'});
        }
    );
}

var ExportJobImage = function(model, taskQueue) {
    var task = new taskmanager.Task();
    task.on('start', function() {
        this.emit('work');
    });
    task.on('work', function() {
        Step(
            function() {
                path.exists(path.join(__dirname, 
                    settings.export_dir, model.get('filename')), this);
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
                    mapfile_dir: path.join(__dirname, settings.mapfile_dir),
                    bbox: model.get('bbox').split(',')
                });
                try {
                    var tile = new Tile(options);
                } catch (err) {
                    model.save({
                        status: 'error',
                        error: 'Tile invalid: ' + err.message
                    });
                }
                if (tile) {
                    tile.render(this);
                }
            },
            function(err, data) {
                if (!err) {
                    fs.writeFile(path.join(__dirname, settings.export_dir, model.get('filename')), data[0], function(err) {
                        if (err) {
                            model.save({
                                status: 'error',
                                error: 'Error saving image: ' + err.message
                            });
                        }
                        else {
                            model.save({
                                status:'complete',
                                progress: 1
                            });
                        }
                        task.emit('finish');
                    });
                }
                else {
                    model.save({
                        status: 'error',
                        error: 'Error rendering image: ' + err.message
                    });
                    task.emit('finish');
                }
            }
        );
    });
    taskQueue.add(task);
    model.save({status: 'processing'});
}

module.exports = function(model, taskQueue) {
    return {
        ExportJobImage: ExportJobImage,
        ExportJobMBTiles: ExportJobMBTiles
    }[model.get('type')](model, taskQueue);
}
