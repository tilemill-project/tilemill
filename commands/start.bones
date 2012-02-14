var path = require('path');
var spawn = require('child_process').spawn;
var defaults = models.Config.defaults;
var command = commands['start'];

command.options['server'] = {
    'title': 'server=1|0',
    'description': 'Run TileMill in windowless mode.',
    'default': defaults.server
};

command.options['port'] = { 'default': defaults.port };
command.options['coreUrl'] = { 'default': defaults.coreUrl };

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

command.prototype.initialize = function(plugin, callback) {
    // Process args.
    plugin.config.server = Boolean(plugin.config.server);

    // Default out the coreUrl, needed to point the client
    // window at the right URL.
    plugin.config.coreUrl = plugin.config.coreUrl ||
        'localhost:' + plugin.config.port;

    Bones.plugin.command = this;
    Bones.plugin.children = {};
    process.title = 'tilemill';
    // Kill child processes on exit.
    process.on('exit', function() {
        _(Bones.plugin.children).each(function(child) { child.kill(); });
    });
    // Handle SIGUSR2 for dev integration with nodemon.
    process.once('SIGUSR2', function() {
        _(Bones.plugin.children).each(function(child) { child.kill('SIGUSR2'); });
        process.kill(process.pid, 'SIGUSR2');
    });
    this.child('core');
    this.child('tile');

    if (!plugin.config.server) plugin.children['core'].stderr.on('data', function(d) {
        if (!d.toString().match(/Started \[Server Core:\d+\]./)) return;
        var client = require('topcube')({
            url: 'http://' + plugin.config.coreUrl,
            name: 'TileMill',
            width: 800,
            height: 600,
            minwidth: 800,
            minheight: 400,
            // win32-only options.
            ico: path.resolve(path.join(__dirname + '/../tilemill.ico')),
            'cache-path': path.join(process.env.HOME, '.tilemill/cache-cefclient'),
            'log-file': path.join(process.env.HOME, '.tilemill/cefclient.log')

        });
        if (client) {
            console.warn('Client window created.');
            plugin.children['client'] = client;
        }
    });

    callback && callback();
};

command.prototype.child = function(name) {
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

