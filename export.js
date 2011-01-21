var taskmanager = require('./taskmanager'),
    taskQueue = new taskmanager.TaskQueue(),
    path = require('path'),
    ExportJobList = require('./project').ExportJobList,
    Step = require('step');

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

    // Loop for scanning and processing Exports.
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
                        job.addTasks(taskQueue);
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
