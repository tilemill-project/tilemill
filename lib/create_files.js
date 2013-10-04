var existsSync = require('fs').existsSync || require('path').existsSync;
var fsutil = require('./fsutil');
var path = require('path');

function init_dirs(dirs, settings) {
    if (!existsSync(settings.files)) {
        console.warn('Creating files dir %s', settings.files);
        fsutil.mkdirpSync(settings.files, 0755);
    }
    dirs.forEach(function(key) {
        var dir = path.join(settings.files, key);
        if (!existsSync(dir)) {
            fsutil.mkdirpSync(dir, 0755);
            console.warn('Creating %s dir %s', key, dir);
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
}

module.exports = {
    init_dirs: init_dirs
};
