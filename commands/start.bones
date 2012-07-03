var path = require('path');
var spawn = require('child_process').spawn;
var redirect = require('../lib/redirect.js');
var defaults = models.Config.defaults;
var command = commands['start'];
var crashutil = require('../lib/crashutil');
// we can drop this when we drop support for ubuntu lucid/maverick/natty
// https://github.com/mapbox/tilemill/issues/1244
var ubuntu_gui_workaround = require('../lib/ubuntu_gui_workaround');

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

    // Set proxy env variable before spawning children
    process.env.HTTP_PROXY = plugin.config.httpProxy || process.env.HTTP_PROXY;

    Bones.plugin.command = this;
    Bones.plugin.children = {};
    process.title = 'tilemill';
    // Kill child processes on exit.
    process.on('exit', function(code, signal) {
        _(Bones.plugin.children).each(function(child, key) {
            console.warn('[tilemill] Closing child process: ' + key  + " (pid:" + child.pid + ")");
            child.kill();
        });
        if (code !== 0)
        {
            crashutil.display_crash_log(function(err,logname) {
                if (err) {
                    console.warn(err.stack || err.toString());
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

    if (!plugin.config.server) plugin.children['core'].stderr.on('data', function(d) {
        if (!d.toString().match(/Started \[Server Core:\d+\]./)) return;
        var client;
        var options = {
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
        };
        ubuntu_gui_workaround.check(function(needed) {
            if (needed) {
                client = ubuntu_gui_workaround.get_client(options);
            } else {
                client = require('topcube')(options);
            }
            if (client) {
                console.warn('[tilemill] Client window created (pass --server=true to disable this)');
                plugin.children['client'] = client;
            }
        });
    });

    callback && callback();
};

command.prototype.child = function(name) {
    Bones.plugin.children[name] = spawn(process.execPath, [
        path.resolve(path.join(__dirname + '/../index.js')),
        name
    ].concat(args));

    redirect.onData(Bones.plugin.children[name]);
    Bones.plugin.children[name].once('exit', function(code, signal) {
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

