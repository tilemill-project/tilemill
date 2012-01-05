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
        process.kill(process.pid, 'SIGUSR2');
    });
    this.child('core');
    this.child('tile');

    Bones.plugin.children['core'].stderr.on('data', function(d) {
        if (!d.toString().match(/Started \[Server Core:\d+\]./)) return;
        console.warn('Starting webkit UI.');
        var client = path.dirname(require.resolve('topcube')) + "/client.js";
        Bones.plugin.children['webkit'] = spawn(process.execPath, [
            client,
            JSON.stringify(['http://localhost:20009', 800, 600])
        ]);
        Bones.plugin.children['webkit'].on('exit', function() {
            process.kill(Bones.plugin.children.pid, 'SIGINT');
            process.exit();
        });
    });

    callback && callback();
};

commands['start'].prototype.child = function(name) {
    var args = [
        path.resolve(path.join(__dirname + '/../index.js')),
        name
    ];
    // Pass any args set on main process into children as well.
    _(require('optimist').argv).forEach(function(val, key) {
        if (key !== '$0' && key !== '_') {
            args.push('--' + key);
            args.push(val);
        }
    });
    Bones.plugin.children[name] = spawn(process.execPath, args);
    Bones.plugin.children[name].stdout.pipe(process.stdout);
    Bones.plugin.children[name].stderr.pipe(process.stderr);
    Bones.plugin.children[name].once('exit', function(code, signal) {
        if (code === 0) this.child(name);
    }.bind(this));
};

