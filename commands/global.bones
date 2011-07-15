var fs = require('fs'),
    path = require('path'),
    Step = require('step'),
    settings = Bones.plugin.config;

Bones.Command.options['port'] = {
    'title': 'port=[port]',
    'description': 'Server port.',
    'default': 8889
};

Bones.Command.options['files'] = {
    'title': 'files=[path]',
    'description': 'Path to files directory.',
    'default': path.join(process.cwd(), 'files')
};

Bones.Command.options['export'] = {
    'title': 'export=[path]',
    'description': 'Path to export directory.',
    'default': path.join(process.cwd(), 'files', 'export')
};

Bones.Command.augment({
    bootstrap: function(parent, plugin, callback) {
        parent.call(this, plugin, function() {
            bootstrap(callback);
        });
    }
});

var bootstrap = function(callback) {
    try {
        fs.statSync(settings.files);
    } catch (Exception) {
        console.log('Creating files dir %s', settings.files);
        fs.mkdirSync(settings.files, 0777);
    }
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

    // Create a default library for the local data directory.
    var data = new models.Library({
        id: 'data',
        name: 'Local data',
        type: 'directory'
    });
    Step(
        function() {
            data.fetch({ success: this, error: this });
        },
        function() {
            if (!data.get('directory_path')) {
                data.save({
                    directory_path: path.join(settings.files, 'data')
                });
            }
        }
    );
    // Process any waiting exports.
    (new models.Exports).fetch({success: function(collection) {
        collection.each(function(model) {
            model.get('status') === 'waiting' && model.process();
        });
    }});
    callback();
};

