/**
 * Queue class for chaining asynchronous calls in a specific order.
 * Typical usage:
 *
 * // Create a new queue.
 * var queue = new TileMill.queue();
 *
 * // Add a series of steps to the queue.
 * queue
 *   .add(function(arg, arg, next) {
 *     my_asynchronous_call(next);
 *   }, [arg, arg])
 *   .add(function(arg, arg, next) {
 *     my_asynchronous_call(next);
 *   }, [arg, arg])
 *   .add(function(arg, arg, next) {
 *     my_asynchronous_call(next);
 *   }, [arg, arg]);
 *
 * // Execute all steps of the queue in order.
 * queue.execute();
 */
TileMill.queue = function() {
  this.queue = [];
  this._store = {};
  return this;
};

TileMill.queue.prototype.add = function(func, args) {
  this.queue.push([func, args]);
  return this;
};

TileMill.queue.prototype.reset = function() {
  this.queue = [];
  return this;
};

TileMill.queue.prototype.execute = function() {
  var func = this.queue.shift();
  this._execute(func[0], func[1]);
  return this;
};

TileMill.queue.prototype._execute = function(func, args) {
  var self = this;
  args = args || [];
  args.push(function() {
    var func = self.queue.shift();
    if (func) {
      self._execute(func[0], func[1]);
    }
  });
  func.apply(this, args);
};

TileMill.queue.prototype.store = function(k, v) {
  this._store[k] = v;
  return this;
};

TileMill.queue.prototype.retrieve = function(k) {
  return this._store[k];
};
