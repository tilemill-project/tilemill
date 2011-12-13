var fs = require('fs');
var fsutil = require('../lib/fsutil');
var path = require('path');
var Step = require('step');
var defaults = models.Config.defaults;
var spawn = require('child_process').spawn;

commands['start'].options['host'] = {
    'title': 'host=[host(s)]',
    'description': 'Accepted hosts.',
    'default': defaults.host
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

    // Spawn tile server & restart it on exits.
    (function startTile() {
        Bones.plugin.tile = spawn(process.execPath, [
            path.resolve(path.join(__dirname + '/../index.js')),
            'tile'
        ]);
        Bones.plugin.tile.stdout.pipe(process.stdout);
        Bones.plugin.tile.stderr.pipe(process.stderr);
        Bones.plugin.tile.on('exit', startTile);
    })();

    callback();
};

