var util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = Queue;
function Queue(callback, concurrency, timeout) {
    this.callback = callback;
    this.concurrency = concurrency || 10;
    this.timeout = timeout || 0;
    this.add = this.add.bind(this);
    this.next = this.next.bind(this);
    this.invoke = this.invoke.bind(this);
    this.queue = [];
    this.running = 0;
}
util.inherits(Queue, EventEmitter);

Queue.prototype.add = function(item) {
    this.queue.push(item);
    if (this.running < this.concurrency) {
        this.running++;
        this.next();
    }
};

Queue.prototype.invoke = function() {
    if (this.queue.length) {
        this.callback(this.queue.shift(), this.next);
    } else {
        this.next();
    }
};

Queue.prototype.next = function(err) {
    if (this.queue.length) {
        if (this.timeout) {
            setTimeout(this.invoke, this.timeout);
        } else {
            process.nextTick(this.invoke);
        }
    } else {
        this.running--;
        if (!this.running) {
            this.emit('empty');
        }
    }
};
