var fs = require('fs');
var fsutil = require('../lib/fsutil');
var path = require('path');
var Step = require('step');
var defaults = models.Config.defaults;
var spawn = require('child_process').spawn;
var mapnik = require('mapnik');
var semver = require('semver');
var os = require('os');
var crypto = require('crypto');

command = Bones.Command.extend();

command.description = 'start ui server';

command.options['port'] = {
    'title': 'port=[port]',
    'description': 'Server port.',
    'default': defaults.port
};

command.options['tilePort'] = {
    'title': 'tilePort=[port]',
    'description': 'Tile server port.',
    'default': defaults.tilePort
};

command.options['coreSocket'] = {
    'title': 'coreSocket=[/path/to/socket]',
    'description': 'Server port socket, overrides `port` option.',
};

command.options['tileSocket'] = {
    'title': 'tileSocket=[/path/to/socket]',
    'description': 'Tile server socket, overrides `tilePort` option.',
};

command.options['coreUrl'] = {
    'title': 'coreUrl=[host:port]'
};

command.options['tileUrl'] = {
    'title': 'tileUrl=[host:port]'
};

command.options['examples'] = {
    'title': 'examples=1|0',
    'description': 'Copy example projects on first start.',
    'default': defaults.examples
};

command.options['sampledata'] = {
    'title': 'sampledata=1|0',
    'description': 'Precache sample data for low bandwidth connections.',
    'default': defaults.sampledata
};

command.options['listenHost'] = {
    'title': 'listenHost=n.n.n.n',
    'description': 'Bind the server to the given host.',
    'default': defaults.listenHost
};

command.options['updates'] = {
    'title': 'updates=1|0',
    'description': 'Automatically check for TileMill updates.',
    'default': true
};

command.options['profile'] = {
    'title': 'profile=1|0',
    'description': 'Report system profile anonymously.',
    'default': true
};

command.options['concurrency'] = {
    'title': 'concurrency=[num]',
    'description': 'Number of exports that can be run concurrently.',
    'default': 4
};

command.options['updatesTime'] = { 'default': 0 };
command.options['updatesVersion'] = { 'default': '0.0.1' };

command.prototype.bootstrap = function(plugin, callback) {
    process.title = 'tilemill-ui';

    var settings = Bones.plugin.config;
    settings.host = false;
    settings.files = path.resolve(settings.files);
    settings.coreUrl = settings.coreUrl || 'localhost:' + settings.port;
    settings.tileUrl = settings.tileUrl || 'localhost:' + settings.tilePort;

    Bones.plugin.abilities = {
        version: (function() {
            try {
                return _(fs.readFileSync(path.resolve(__dirname + '/../VERSION'),'utf8').split('\n')).compact();
            } catch(e) {
                return ['unknown', 'unknown'];
            }
        })(),
        platform: process.platform,
        totalmem: os.totalmem(),
        cpus: os.cpus(),
        coreUrl: settings.coreUrl,
        tileUrl: settings.tileUrl,
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
    ['export', 'project', 'cache'].forEach(function(key) {
        var dir = path.join(settings.files, key);
        if (!path.existsSync(dir)) {
            console.warn('Creating %s dir %s', key, dir);
            fsutil.mkdirpSync(dir, 0755);
            if (key === 'project' && settings.examples) {
                var examples = path.resolve(path.join(__dirname, '..', 'examples'));
                fsutil.cprSync(examples, dir);
            } else if (key === 'cache' && settings.sampledata) {
                var shapefile = '82945364-10m-admin-0-countries';
                var data = path.resolve(path.join(__dirname, '..', 'data', shapefile));
                fsutil.cprSync(data, path.resolve(path.join(dir, shapefile)));
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
        .map(function(p, index) {
            try {
            return fs.readdirSync(p).map(function(dir) {
                try {
                var pkg = path.join(p, dir, 'package.json');
                var data = JSON.parse(fs.readFileSync(pkg, 'utf8'));
                data.core = index === 0;
                data.id = data.name;

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

    // Config values to save.
    var attr = {};

    // Skip latest TileMill version check if disabled or
    // we've checked the npm repo in the past 24 hours.
    var skip = !settings.updates || (settings.updatesTime > Date.now() - 864e5);
    var npm = require('npm');
    Step(function() {
        if (skip) return this();

        console.warn('Checking for new version of TileMill...');
        npm.load({}, this);
    }, function(err) {
        if (skip || err) return this(err);

        npm.localPrefix = path.join(process.env.HOME, '.tilemill');
        npm.commands.view(['tilemill'], true, this);
    }, function(err, resp) {
        if (skip || err) return this(err);

        if (!_(resp).size()) throw new Error('Latest TileMill package not found.');
        if (!_(resp).toArray()[0].version) throw new Error('No version for TileMill package.');
        console.warn('Latest version of TileMill is %s.', _(resp).toArray()[0].version);
        attr.updatesVersion = _(resp).toArray()[0].version;
        attr.updatesTime = Date.now();
        this();
    }, function(err) {
        // Continue despite errors but log them to the console.
        if (err) console.error(err);
        // Save any config attributes.
        if (_(attr).keys().length) (new models.Config).save(attr, {
            error: function(m, err) { console.error(err); }
        });
        callback();
    });
};

command.prototype.initialize = function(plugin, callback) {
    this.servers = {};
    this.servers['Core'] = new plugin.servers['Core'](plugin);
    this.servers['Core'].start(function() {
        console.warn('Started %s.', Bones.utils.colorize(this, 'green'));
        this.emit('start');
        callback && callback();
    });
};

