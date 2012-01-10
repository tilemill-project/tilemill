var path = require('path');
var spawn = require('child_process').spawn;

// Retrieve args to pass to child process here
// prior to Bones filtering out options.
var args = _(require('optimist').argv).chain()
    .map(function(val, key) {
        if (key === '$0') return;
        if (key === '_') return;
        return '--' + key + '=' + val;
    })
    .compact()
    .value();

commands['start'].prototype.initialize = function(plugin, callback) {
    Bones.plugin.command = this;
    Bones.plugin.children = {};
    process.title = 'tilemill';
    process.once('SIGUSR2', function() {
        _(Bones.plugin.children).chain()
            .pluck('pid')
            .each(function(pid) { process.kill(pid, 'SIGUSR2') });
        process.kill(process.pid, 'SIGUSR2');
    });
    this.child('core');
    this.child('tile');
    callback && callback();
};

commands['start'].prototype.child = function(name) {
    Bones.plugin.children[name] = spawn(process.execPath, [
        path.resolve(path.join(__dirname + '/../index.js')),
        name
    ].concat(args));
    Bones.plugin.children[name].stdout.pipe(process.stdout);
    Bones.plugin.children[name].stderr.pipe(process.stderr);
    Bones.plugin.children[name].once('exit', function(code, signal) {
        if (code === 0) this.child(name);
    }.bind(this));
};

