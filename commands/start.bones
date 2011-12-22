var path = require('path');
var spawn = require('child_process').spawn;

commands['start'].prototype.initialize = function(plugin, callback) {
    Bones.plugin.command = this;
    Bones.plugin.children = {};
    process.title = 'tilemill';
    process.once('SIGUSR2', function() {
        _(Bones.plugin.children).chain()
            .pluck('pid')
            .each(function(pid) { process.kill(pid, 'SIGUSR2') });
    });
    this.child('core');
    this.child('tile');
    callback && callback();
};

commands['start'].prototype.child = function(name) {
    Bones.plugin.children[name] = spawn(process.execPath, [
        path.resolve(path.join(__dirname + '/../index.js')),
        name
    ]);
    Bones.plugin.children[name].stdout.pipe(process.stdout);
    Bones.plugin.children[name].stderr.pipe(process.stderr);
    Bones.plugin.children[name].once('exit', function(code, signal) {
        this.child(name);
    }.bind(this));
};

