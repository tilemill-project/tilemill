// Useful filesystem utilities.
var fs = require('fs');
var Step = require('step');
var path = require('path');
var constants = require('constants');

// Returns a file stat object with additional `data` and `basename` properties.
function read(filepath, callback) {
    fs.stat(filepath, function(err, stat) {
        if (err) return callback(err);
        fs.readFile(filepath, 'utf8', function(err, data) {
            if (err) return callback(err);
            stat.data = data;
            stat.basename = path.basename(filepath);
            callback(null, stat);
        });
    });
};

// Returns an array of stat objects with additional `basename` property.
// If the file is a directory, looks for a `.origin` file and adds an
// `.origin` property.
function readdir(filepath, callback) {
    fs.readdir(filepath, function(err, files) {
        if (err) return callback(err);
        if (!files.length) return callback(null, []);
        var stats = [];
        var s = function(file, attr) {
            attr = attr || {};
            fs.stat(path.join(filepath, file), function(err, stat) {
                if (err) return callback(err);
                _(stat).extend(attr);
                stats.push(stat);
                stats.length === files.length && callback(null, stats);
            });
        };
        _(files).each(function(file) {
            var origin = path.join(filepath, file, '.origin');
            path.exists(origin, function(exists) {
                if (exists) {
                    fs.readFile(origin, 'utf8', function(err, uri) {
                        s(file, {basename: file, origin: uri});
                    });
                } else {
                    s(file, {basename: file});
                }
            });
        });
    });
};

// https://gist.github.com/707661
function mkdirp(p, mode, f) {
    var cb = f || function() {};
    if (p.charAt(0) != '/') {
        cb(new Error('Relative path: ' + p));
        return;
    }

    var ps = path.normalize(p).split('/');
    path.exists(p, function(exists) {
        if (exists) return cb(null);
        mkdirp(ps.slice(0, -1).join('/'), mode, function(err) {
            if (err && err.errno != constants.EEXIST) return cb(err);
            fs.mkdir(p, mode, cb);
        });
    });
};

function mkdirpSync(p, mode) {
    var ps = path.normalize(p).split('/');
    var created = [];
    while (ps.length) {
        created.push(ps.shift());
        if (created.length > 1 && !path.existsSync(created.join('/'))) {
            var err = fs.mkdirSync(created.join('/'), 0755);
            if (err) return err;
        }
    }
};

// Recursive rm.
function rm(filepath, callback) {
    var killswitch = false;
    fs.lstat(filepath, function(err, stat) {
        if (err) return callback(err);
        if (stat.isFile() || stat.isSymbolicLink()) return fs.unlink(filepath, callback);
        if (!stat.isDirectory()) return callback(new Error('Unrecognized file.'));
        Step(function() {
            fs.readdir(filepath, this);
        },
        function(err, files) {
            if (err) throw err;
            if (files.length === 0) return this(null, []);
            var group = this.group();
            _(files).each(function(file) {
                rm(path.join(filepath, file), group());
            });
        },
        function(err) {
            if (err) return callback(err);
            fs.rmdir(filepath, callback);
        });
    });
};

module.exports = {
    read: read,
    readdir: readdir,
    mkdirp: mkdirp,
    mkdirpSync: mkdirpSync,
    rm: rm
};

