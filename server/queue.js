var events = require('events'),
    sys = require('sys');

// constructor for queue
var Queue = function(opts) {
    var that = this;

    this.opts = opts || {}
    this.tasks = [];
    this.queue = [];
    this.active = [];

    this.limit = 10;

    // process.on('SIGINT', function() {
    //     that.stop();
    // });

    this.start();
}

// start the timer to spawn tasks.
Queue.prototype.start = function() {
    var that = this;
    this._interval = this._interval || setInterval(function() { that.spawn(); }, 1000, [this]);
}

// remove the timer from the queue to check for more items.
Queue.prototype.stop = function() {
    if (this._interval !== undefined) {
        clearInterval(this._interval);
        delete this._interval;
    }
}

// test to see if more tasks can be started
// could be overridden if needed.
Queue.prototype.spawnMore = function() {
  var count = 0;

  this.active.forEach(function(el) { count++ });

  if (count >= this.limit) {
      return false;
  }
  else {
      return true;
  }
}

// callback that spawns the individual tasks
Queue.prototype.spawn = function() {
    if (this.spawnMore()) {
        var next_task = this.queue.pop();

        if (next_task !== undefined) {
            this.active.push(next_task);
            this.startTask(this.tasks[next_task]);
        }
     }

}

// start a task's processing.
Queue.prototype.startTask = function(task) {

    var that = this;

    // set up a listener on the task to remove it from this queue.
    task.on('finish', function() { that.remove(task); });

    // set a status somewhere
    task.emit('start', task);

    // if there are no work listener, just emit finish.
    if (task.listeners('work').length === 0) {
        task.emit('finish');
    }
}

// add a task to the queue
Queue.prototype.add = function(task) {
    // reset the length property on the tasks array.
    this.tasks = this.tasks.some(function() { return true; }) ? this.tasks : [];

    // add the task to the end of the queue
    task._index = this.tasks.push(task) - 1;

    // add it to the queue array
    this.queue.push(task._index);

    return task;
}

// remove a task from the queue
Queue.prototype.remove = function(task) {
    var idx;
    idx = this.active.indexOf(task._index);
    if (idx !== -1) {
        delete this.active[idx];
    }

    idx = this.queue.indexOf(task._index);
    if (idx !== -1) {
        delete this.queue[idx];
    }


    delete this.tasks[task._index];
}

// constructor for the tasks
var Task = function(opts) {
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

sys.inherits(Task, events.EventEmitter);

module.exports = {
    Queue: Queue,
    Task: Task
}
