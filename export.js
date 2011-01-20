var fs = require('fs'),
    path = require('path'),
    tasks = require('./jobs'),
    models = require('./project'),
    Tile = require('tilelive.js').Tile,
    _ = require('underscore')._;

var mapnik = require('mapnik');
mapnik.register_datasources('/usr/local/lib/mapnik2/input');
mapnik.register_fonts('/usr/local/lib/mapnik2/fonts/');

module.exports = function(app, settings) {
    var tq = new tasks.JobQueue();

    var scan = function() {
        console.log('scanning for jobs');
        var jobQueue = new models.ExportJobList();
        jobQueue.fetch({
            success: function(coll) {
                coll.each(function(jobModel) {
                    var task = new tasks.Job(jobModel.attributes);
                    task.on('start', function() {
                        var that = this;
                        console.log("Start job");
                        // start some long running task
                        setTimeout( function() {
                            that.emit('work');
                        }, 1000);
                    });

                    task.on('work', function() {
                        console.log("Job work unit");
                        var that = this;
                        var options = _.extend(this.opts, {
                            scheme: 'tile',
                            format: 'png',
                            mapfile_dir: path.join(__dirname, settings.mapfile_dir),
                            bbox: this.opts.bbox.split(',')
                        });
                        console.log(this.opts);
                        
                        try {
                            var tile = new Tile(options);
                        } catch (err) {
                            console.log('Tile invalid: ' + err.message);
                        }

                        tile.render(function(err, data) {
                            if (!err) {
                                // TODO: Save image
                                fs.writeFile(path.join(__dirname, settings.export_dir, that.opts.filename), data[0], function(err) {
                                    if (err) throw err;
                                    console.log('Made a tile');
                                });
                            } else {
                                console.log('Error rendering image', err);
                            }
                        });
                        
                        setTimeout( function() {
                            that.emit('finish');
                        }, 1000);
                    });

                    task.on('finish', function() {
                        console.log('Job finishes');
                    });
                    tq.add(task);

                });
            }
        });
        // setTimeout(scan, 30000);
    }
    scan();
}
