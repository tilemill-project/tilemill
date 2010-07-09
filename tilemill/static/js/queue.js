TileMill.queue = function() {
  return this;
};
TileMill.queue.prototype.queue = [];
TileMill.queue.prototype.add = function(func, args) {
  this.queue.push([func, args]);
}
TileMill.queue.prototype.execute = function() {
  var func = this.queue.shift();
  this._execute(func[0], func[1]);
}
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
}
TileMill.queue.prototype.store = function(k, v) {
  this._store[k] = v;
}
TileMill.queue.prototype.retrieve = function(k) {
  return this._store[k];
}
TileMill.queue.prototype._store = {};