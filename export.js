var taskmanager = require('./taskmanager'),
    path = require('path'),
    ExportJobList = require('./project').ExportJobList,
    Step = require('step');

var tq = new taskmanager.TaskQueue();
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
                        job.getTasks().forEach(function(task) {
                            tq.add(task);
                        })
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
