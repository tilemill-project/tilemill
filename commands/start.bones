var path = require('path');
var spawn = require('child_process').spawn;
var defaults = models.Config.defaults;

commands['start'].options['port'] = { 'default': defaults.port };
commands['start'].options['coreUrl'] = { 'default': defaults.coreUrl };

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
    // Process args.
    plugin.config.server = Boolean(plugin.config.server);

    // Default out the coreUrl, needed to point the client
    // window at the right URL.
    plugin.config.coreUrl = plugin.config.coreUrl ||
        'localhost:' + plugin.config.port;

    Bones.plugin.command = this;
    Bones.plugin.children = {};
    process.title = 'tilemill';
    process.on('exit', function() {
        _(Bones.plugin.children).chain()
            .pluck('pid')
            .each(function(pid) { process.kill(pid, 'SIGINT') });
        process.kill(process.pid, 'SIGINT');
    });
    process.once('SIGUSR2', function() {
        _(Bones.plugin.children).chain()
            .pluck('pid')
            .each(function(pid) { process.kill(pid, 'SIGUSR2') });
        process.kill(process.pid, 'SIGUSR2');
    });
    this.child('core');
    this.child('tile');

    if (!plugin.config.server) plugin.children['core'].stderr.on('data', function(d) {
        if (!d.toString().match(/Started \[Server Core:\d+\]./)) return;
        console.warn('Starting webkit UI.');
        plugin.children['webkit'] = require('topcube')({
            url: 'http://' + plugin.config.coreUrl,
            name: 'TileMill',
            width: 800,
            height: 600,
            minwidth: 800,
            minheight: 400
        });
    });

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

