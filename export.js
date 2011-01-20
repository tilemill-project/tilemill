var taskmanager = require('./taskmanager'),
    ExportJobList = require('./project').ExportJobList,
    Step = require('Step');

var tq = new taskmanager.TaskQueue();
module.exports = function(app, settings) {
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
