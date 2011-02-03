var fs = require('fs'),
    path = require('path'),
    Step = require('step');

// Bootstrap
// ---------
// Application bootstrap. Ensures that files directories exist at server start.
module.exports = function(app, settings) {
    try {
        fs.statSync(settings.files);
    } catch (Exception) {
        console.log('Creating files dir %s', settings.files);
        fs.mkdirSync(settings.files, 0777);
    }

    try {
        fs.statSync(settings.mapfile_dir);
    } catch (Exception) {
        console.log('Creating mapfile dir %s', settings.mapfile_dir);
        fs.mkdirSync(settings.mapfile_dir, 0777);
    }

    try {
        fs.statSync(settings.data_dir);
    } catch (Exception) {
        console.log('Creating data dir %s', settings.data_dir);
        fs.mkdirSync(settings.data_dir, 0777);
    }

    try {
        fs.statSync(settings.export_dir);
    } catch (Exception) {
        console.log('Creating export dir %s', settings.export_dir);
        fs.mkdirSync(settings.export_dir, 0777);
    }

    // Create a default library for the local data directory.
    var models = require('models-server');
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
                    'directory_path': path.join(__dirname, '..', 'files', 'data')
                });
            }
        }
    );
}

