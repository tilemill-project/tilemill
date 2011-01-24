var taskmanager = require('taskmanager'),
    path = require('path'),
    ExportJobList = require('project').ExportJobList,
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

    // Loop for scanning and processing exports. Do not process exports if
    // testing -- otherwise, tests will never finish.
    // @TODO: Set up some other mechanism for testing exports.
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
        var taskQueue = new taskmanager.TaskQueue();
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
}
