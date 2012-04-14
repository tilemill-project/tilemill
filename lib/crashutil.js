var path = require('path');
var child = require('child_process');
var glob = require('glob');
var chrono = require('chrono');

var path_sep = process.platform === 'win32' ? '\\' : '/';

function display_crash_log(callback) {
    if (process.platform == 'darwin') {
        var now = new Date();
        var crash_path = path.join(process.env.HOME, 'Library/Logs/DiagnosticReports');
        var search = crash_path + '/node_' + now.format('Y-m-d') + '-*.crash';
        glob(search, {}, function(err, files) {
            if (files.length > 0) {
                console.log('found ' + files.length + ' crash logs for node');
                //console.log(files);
                // grab the latest
                var latest = files[files.length - 1];
                //console.log('opening ' + latest);
                //child.exec('open -t ' + latest);
                callback(latest);
            } else {
                console.log('no crash logs found');
                callback(null);
            }
        });
    } else if (process.platform === 'win32') {
        var crash_path = path.join(process.env.HOME, 'AppData/Local/Microsoft/Windows/WER/ReportArchive/');
        // normalize to unix paths to that glob works
        crash_path = crash_path.replace(/\\/g, '/');
        var options = {cwd: crash_path};
        var pattern = 'AppCrash_node.exe_*';
        glob(pattern, options, function(err, files) {
            if (files.length > 0) {
                console.log('found ' + files.length + ' crash logs for node');
                //console.log(files);
                // grab the latest
                var latest = path.join(crash_path, files[files.length - 1]);
                //console.log('opening ' + latest);
                //child.exec('start ' + latest);
                callback(latest);
            } else {
                console.log('no crash logs found');
                callback(null);
            }
        });
    } else {
        callback(null);
    }
}

module.exports = {
    display_crash_log: display_crash_log
};
