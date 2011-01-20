var taskmanager = require('./taskmanager'),
    Step = require('step'),
    path = require('path'),
    Tile = require('tilelive.js').Tile,
    fs = require('fs');

var ExportJobImage = function(model) {
    var task = new taskmanager.Task();
    task.on('start', function() {
        this.emit('work');
    });
    task.on('work', function() {
        model.save({status: 'processing'});
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
    var tasks = [];
    tasks.push(task);
    return tasks;
}

module.exports = function(model) {
    return {
        ExportJobImage: ExportJobImage
    }[model.get('type')](model);
}
