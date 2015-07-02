var path = require('path');
var spawn = require('child_process').spawn;
var redirect = require('../lib/redirect.js');
var defaults = models.Config.defaults;
var command = commands['start'];
var crashutil = require('../lib/crashutil');
var logger = require('fastlog')('', 'debug', '<${timestamp}>');

command.options['server'] = {
    'title': 'server=1|0',
    'description': 'Run TileMill in windowless mode (no client window will be launched at startup).',
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
        '127.0.0.1:' + plugin.config.port;

    // Set proxy env variable before spawning children
    if (plugin.config.httpProxy) process.env.HTTP_PROXY = plugin.config.httpProxy;

    // munge verbose setting into what bones/millstone expects
    if (plugin.config.verbose == 'on') {
        process.env.NODE_ENV = 'development';
    } else  {
        // beware, do not set to 'production': https://github.com/mapbox/tilemill/issues/1697
        process.env.NODE_ENV = 'normal'; // NOTE: normal is arbitrary, just needs to be not 'development'
    }

    Bones.plugin.command = this;
    Bones.plugin.children = {};
    process.title = 'tilemill';
    // Kill child processes on exit.
    process.on('SIGINT', function(code, signal) {
        _(Bones.plugin.children).each(function(child, key) {
            console.warn('[tilemill] Closing child process: ' + key  + " (pid:" + child.pid + ")");
            child.kill();
        });
        if (code !== 0)
        {
            crashutil.display_crash_log(function(err,logname) {
                if (err) {
                    console.warn('Fatal error: ' + err.stack || err.toString());
                }
                if (logname) {
                    console.warn("[tilemill] Please post this crash log: '" + logname + "' to https://github.com/mapbox/tilemill/issues");
                }
            });
        }
        console.warn('Exiting [' + process.title + ']');
    });
    // Handle SIGUSR2 for dev integration with nodemon.
    process.once('SIGUSR2', function() {
        _(Bones.plugin.children).each(function(child) { child.kill('SIGUSR2'); });
        process.kill(process.pid, 'SIGUSR2');
    });
    this.child('core');
    this.child('tile');

    if (!plugin.config.server) plugin.children['tile'].stderr.on('data', function(data) {
        console.log(data); // Used for logging events to the parent process
        if (!data.toString().match(/Started \[Server Tile:\d+\]./)) return;
    });

    if (!plugin.config.server) plugin.children['core'].stderr.on('data', function(data) {
        console.log(data); // Used for logging events to the parent process
        if (!data.toString().match(/Started \[Server Core:\d+\]./)) return;
    });

    callback && callback();
};

command.prototype.child = function(name) {
    Bones.plugin.children[name] = spawn(process.execPath, [
        path.resolve(path.join(__dirname + '/../index-server.js')),
        name
    ].concat(args));

    redirect.onData(Bones.plugin.children[name]);
    Bones.plugin.children[name].once('SIGINT', function(code, signal) {
        if (code === 0) {
            // restart server if exit was clean
            console.warn('[tilemill] Restarting child process: "' + name + '"');
            this.child(name);
        } else {
            if (signal) {
                var msg = '[tilemill] Error: child process: "' + name + '" failed with signal "' + signal + '"';
                if (code != undefined)
                    msg += " and code '" + code + "'";
                console.warn(msg);
                _(Bones.plugin.children).each(function(child) { child.kill(signal); });
                process.exit(1);
            } else {
                // Note: it would be great, in many cases, to auto-restart here
                // but we cannot because we will trigger recursion like in cases
                // of failed startup due to EADDRINUSE
                console.warn('[tilemill] Error: child process: "' + name + '" failed with code "' + code + '"')
                _(Bones.plugin.children).each(function(child) { child.kill(); });
            }
        }
    }.bind(this));
};

