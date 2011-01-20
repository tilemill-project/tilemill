var events = require('events'),
    sys = require('sys');

// constructor for job queue
var JobQueue = function(opts) {
    var that = this;

    this.opts = opts || {}
    this.jobs = [];
    this.queue = [];
    this.active = [];

    this.limit = 10;

    // process.on('SIGINT', function() {
    //     that.stop();
    // });

    this.start();
}

// start the timer to spawn tasks.
JobQueue.prototype.start = function() {
    var that = this;
    this._interval = this._interval || setInterval(function() { that.spawn(); }, 1000, [this]);
}

// remove the timer from the queue to check for more items.
JobQueue.prototype.stop = function() {
    if (this._interval !== undefined) {
        clearInterval(this._interval);
        delete this._interval;
    }
}

// test to see if more jobs can be started
// could be overridden if needed.
JobQueue.prototype.spawnMore = function() {
  var count = 0;

  this.active.forEach(function(el) { count++ });

  if (count >= this.limit) {
      return false;
  }
  else {
      return true;
  }
}

// callback that spawns the individual jobs
JobQueue.prototype.spawn = function() {
    if (this.spawnMore()) {
        var next_task = this.queue.pop();

        if (next_task !== undefined) {
            this.active.push(next_task);
            this.startJob(this.jobs[next_task]);
        }
     }

}

// start a job's processing.
JobQueue.prototype.startJob = function(job) {

    var that = this;
    // set a status somewhere
    job.emit('start', job);

    // set up a listener on the job to remove it from this queue.
    job.on('finish', function() { that.remove(job); });

    // if there are no work listener, just emit finish.
    if (job.listeners('work').length === 0) {
        job.emit('finish');
    }
}

// add a job to the queue
JobQueue.prototype.add = function(job) {
    // reset the length property on the jobs array.
    this.jobs = this.jobs.some(function() { return true; }) ? this.jobs : [];

    // add the job to the end of the queue
    job._index = this.jobs.push(job) - 1;

    // add it to the queue array
    this.queue.push(job._index);

    return job;
}

// remove a job from the queue
JobQueue.prototype.remove = function(job) {
    var idx;
    idx = this.active.indexOf(job._index);
    if (idx !== -1) {
        delete this.active[idx];
    }

    idx = this.queue.indexOf(job._index);
    if (idx !== -1) {
        delete this.queue[idx];
    }


    delete this.jobs[job._index];
}

// constructor for the jobs
var Job = function(opts) {
    events.EventEmitter.call(this);

    this.opts = opts || {}

    if (opts && opts.start !== undefined) {
        this.on('start', opts.start);
    }

    if (opts && opts.work !== undefined) {
        this.on('work', opts.work);
    }

    if (opts && opts.finish !== undefined) {
        this.on('finish', opts.finish);
    }
}

sys.inherits(Job, events.EventEmitter);

module.exports = {
    JobQueue: JobQueue,
    Job: Job
}
