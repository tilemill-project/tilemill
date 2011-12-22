var fs = require('fs');
var fsutil = require('../lib/fsutil');
var path = require('path');
var Step = require('step');
var defaults = models.Config.defaults;
var spawn = require('child_process').spawn;
var mapnik = require('mapnik');
var semver = require('semver');

commands['start'].options['host'] = {
    'title': 'host=[host(s)]',
    'description': 'Accepted hosts.',
    'default': defaults.host
};

commands['start'].options['hostname'] = {
    'title': 'hostname=[hostname]',
    'default': defaults.hostname
};

commands['start'].options['port'] = {
    'title': 'port=[port]',
    'description': 'Server port.',
    'default': defaults.port
};

commands['start'].options['tilePort'] = {
    'title': 'tilePort=[port]',
    'description': 'Tile server port.',
    'default': defaults.tilePort
};

commands['start'].options['examples'] = {
    'title': 'examples=1|0',
    'description': 'Copy example projects on first start.',
    'default': defaults.examples
};

commands['start'].options['sampledata'] = {
    'title': 'sampledata=1|0',
    'description': 'Precache sample data for low bandwidth connections.',
    'default': defaults.sampledata
};

commands['start'].options['listenHost'] = {
    'title': 'listenHost=n.n.n.n',
    'description': 'Bind the server to the given host.',
    'default': defaults.listenHost
};

commands['start'].prototype.bootstrap = function(plugin, callback) {
    process.title = 'tilemill';

    var settings = Bones.plugin.config;
    settings.files = path.resolve(settings.files);
    settings.disable = _(settings.disable).isString()
        ? settings.disable.split(',')
        : settings.disable;

    Bones.plugin.abilities = {
        version: (function() {
            try {
                return _(fs.readFileSync(path.resolve(__dirname + '/../VERSION'),'utf8').split('\n')).compact();
            } catch(e) {
                return ['unknown', 'unknown'];
            }
        })(),
        tilePort: settings.tilePort,
        tilemill: JSON.parse(fs.readFileSync(path.resolve(__dirname + '/../package.json'),'utf8')),
        carto: require('carto').tree.Reference.data,
        fonts: mapnik.fonts(),
        datasources: mapnik.datasources(),
        exports: {
            mbtiles: true,
            png: true,
            pdf: mapnik.supports.cairo,
            svg: mapnik.supports.cairo
        }
    };

    var configDir = path.join(process.env.HOME, '.tilemill');
    if (!path.existsSync(configDir)) {
        console.warn('Creating configuration dir %s', configDir);
        fsutil.mkdirpSync(configDir, 0755);
    }

    if (!path.existsSync(settings.files)) {
        console.warn('Creating files dir %s', settings.files);
        fsutil.mkdirpSync(settings.files, 0755);
    }
    ['export', 'project', 'cache', 'cache/tile'].forEach(function(key) {
        var dir = path.join(settings.files, key);
        if (!path.existsSync(dir)) {
            console.warn('Creating %s dir %s', key, dir);
            fsutil.mkdirpSync(dir, 0755);
            if (key === 'project' && settings.examples) {
                var examples = path.resolve(path.join(__dirname, '..', 'examples'));
                fsutil.cprSync(examples, dir);
            } else if (key === 'cache' && settings.sampledata) {
                var data = path.resolve(path.join(__dirname, '..', 'data'));
                fsutil.cprSync(data, dir);
            }
        }
    });

    // Apply server-side mixins/overrides.
    var db = require('backbone-dirty')(settings.files + '/app.db');
    db.dirty.on('error', console.log);
    Backbone.sync = db.sync;

    // Process any waiting exports.
    (new models.Exports).fetch();

    // Load plugins.
    // @TODO we may need to move this to a global bootstrap to allow
    // other servers/processes to be accessible to plugin code.
    Bones.plugin.abilities.plugins = _([
        path.resolve(__dirname + '/../plugins'),
        path.join(process.env.HOME, '.tilemill/node_modules')
    ]).chain()
        .map(function(p) {
            try {
            return fs.readdirSync(p).map(function(dir) {
                try {
                var pkg = path.join(p, dir, 'package.json');
                var data = JSON.parse(fs.readFileSync(pkg, 'utf8'));

                // Engines key missing.
                if (!data.engines || !data.engines.tilemill) {
                    console.warn('Plugin [%s] "engines" missing.',
                        Bones.utils.colorize(data.name, 'red'));
                    return false;
                }
                // Check that TileMill version satisfies plugin requirements.
                // Pass data through such that the plugin can be shown in the
                // UI as failing to satisfy requirements.
                if (!semver.satisfies(Bones.plugin.abilities.tilemill.version, data.engines.tilemill)) {
                    console.warn('Plugin [%s] requires TileMill %s.',
                        Bones.utils.colorize(data.name, 'red'),
                        data.engines.tilemill);
                    return data;
                }
                // Load plugin.
                require('bones').load(path.join(p, dir));
                console.warn('Plugin [%s] loaded.', Bones.utils.colorize(data.name, 'green'));
                return data;
                } catch (e) { console.error(e); return false; }
            });
            } catch(e) { return []; }
        })
        .flatten()
        .compact()
        .reduce(function(memo, plugin) {
            memo[plugin.name] = plugin;
            return memo;
        }, {})
        .value();

    callback();
};

commands['start'].prototype.initialize = function(plugin, callback) {
    Bones.plugin.command = this;

    this.servers = {};
    if (process.env.NODE_ENV === 'test') {
        this.servers['Core'] = new plugin.servers['Core'](plugin);
        this.servers['Tile'] = new plugin.servers['Tile'](plugin);
    } else {
        this.servers['Core'] = new plugin.servers['Core'](plugin);
        this.tileServer();
    }

    var remaining = _(this.servers).size();
    _(this.servers).each(function(server) {
        server.start(function() {
            remaining--;
            console.warn('Started %s.', Bones.utils.colorize(server, 'green'));
            server.emit('start');
            if (!remaining) callback && callback();
        }.bind(this));
    }.bind(this));
};

commands['start'].prototype.tileServer = function() {
    // Kill the tile server if present to force a restart.
    if (Bones.plugin.tile) {
        Bones.plugin.tile.kill();
        delete Bones.plugin.tile;
        return;
    }

    Bones.plugin.tile = spawn(process.execPath, [
        path.resolve(path.join(__dirname + '/../index.js')),
        'tile'
    ]);
    Bones.plugin.tile.stdout.pipe(process.stdout);
    Bones.plugin.tile.stderr.pipe(process.stderr);
    Bones.plugin.tile.once('exit', function(code, signal) {
        this.tileServer();
    }.bind(this));

    process.once('SIGUSR2', function() {
        process.kill(Bones.plugin.tile.pid, 'SIGUSR2');
        process.kill(process.pid, 'SIGUSR2');
    });
};

