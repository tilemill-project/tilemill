var taskmanager = require('./taskmanager'),
    Step = require('step'),
    path = require('path'),
    Tile = require('tilelive.js').Tile,
    fs = require('fs'),
    sys = require('sys'),
    events = require('events');

var ExportMBTiles = function(model, taskQueue) {
    var workTask = function(counter, taskQueue) {
        events.EventEmitter.call(this);
        this.counter = counter;
        this.taskQueue = taskQueue;
        this.on('start', function() {
            this.emit('work');
        });
        this.on('work', function() {
            this.emit('finish');
        });
        this.on('finish', function() {
            if (this.counter < 10) {
                var next = new workTask(this.counter + 1, this.taskQueue);
                this.taskQueue.add(next);
            }
            else {
                model.save({status: 'complete', progress: 1});
            }
        });
    }
    sys.inherits(workTask, events.EventEmitter);
    taskQueue.add(new workTask(0, taskQueue));
    model.save({status: 'processing'});
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
        ExportMBTiles: ExportMBTiles
    }[model.get('type')](model, taskQueue);
}
