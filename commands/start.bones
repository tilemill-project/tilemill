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

// @TODO this used to be called `export_dir`. Migrate this value.
commands['start'].options['export'] = {
    'title': 'export=[path]',
    'description': 'Path to export directory.',
    'default': path.join(process.cwd(), 'files', 'export')
};

commands['start'].prototype.bootstrap = function(plugin, callback) {
    var settings = Bones.plugin.config;
    Step(
        function() {
            try {
                fs.statSync(settings.files);
            } catch (Exception) {
                console.log('Creating files dir %s', settings.files);
                fsutil.mkdirp(settings.files, 0777, this);
            }
        },
        function(err) {
            if (err) throw err;
            try {
                fs.statSync(settings['export']);
            } catch (Exception) {
                console.log('Creating export dir %s', settings['export']);
                fs.mkdirSync(settings['export'], 0777);
            }

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
        }
    );
};

