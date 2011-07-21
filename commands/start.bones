var fs = require('fs'),
    fsutil = require('../lib/fsutil'),
    path = require('path'),
    Step = require('step');

commands['start'].options['port'] = {
    'title': 'port=[port]',
    'description': 'Server port.',
    'default': 8889
};

commands['start'].options['files'] = {
    'title': 'files=[path]',
    'description': 'Path to files directory.',
    'default': path.join(process.env.HOME, 'Documents', 'TileMill')
};

commands['start'].prototype.bootstrap = function(plugin, callback) {
    var settings = Bones.plugin.config;
    if (!path.existsSync(settings.files)) {
        console.warn('Creating files dir %s', settings.files);
        fsutil.mkdirpSync(settings.files, 0755);
    }
    ['export', 'project', 'data'].forEach(function(key) {
        var dir = path.join(settings.files, key);
        if (!path.existsSync(dir)) {
            console.warn('Creating %s dir %s', key, dir);
            fsutil.mkdirpSync(dir, 0755);
        }
    });

    // @TODO: Better infrastructure for handling updates.
    // Update 1: Migrate to new backbone-dirty key format.
    try {
        var db = fs.readFileSync(settings.files + '/app.db', 'utf8');
        if (db && db.match(/{"key":"(export|library|settings):/g)) {
            db = db.replace(/{"key":"export:/g, '{"key":"api/Export/');
            db = db.replace(/{"key":"library:/g, '{"key":"api/Library/');
            db = db.replace(/{"key":"settings:/g, '{"key":"api/Settings/');
            fs.writeFileSync(settings.files + '/app.db', db);
            console.log('Update: Migrated to new backbone-dirty key format.');
        }
    } catch (Exception) {}

    // Apply server-side mixins/overrides.
    var sync = require('backbone-dirty')(settings.files + '/app.db').sync;
    Backbone.sync = sync;

    // Process any waiting exports.
    (new models.Exports).fetch();
    callback();
};

