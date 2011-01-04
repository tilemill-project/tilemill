/**
 * Bootstrap the application - ensure that directories
 * exist, etc
 */
module.exports = function(app, settings) {
    var fs = require('fs');
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
}

