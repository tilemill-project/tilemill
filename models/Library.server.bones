var fs = require('fs');
var Step = require('step');
var path = require('path');
var read = require('../lib/fsutil').read;
var readdir = require('../lib/fsutil').readdir;
var mkdirp = require('../lib/fsutil').mkdirp;
var winDrives = require('../lib/fsutil').winDrives;
var rm = require('../lib/fsutil').rm;
var s3 = require('../lib/s3');
var config = Bones.plugin.config;
var url = require('url');
// node v6 -> v8 compatibility
var existsAsync = require('fs').exists || require('path').exists;
var millstone = require('millstone');


// File based extensions supported by TileMill.
var extFile = ['.zip'];
// Sqlite extensions.
var extSqlite = [];
Object.keys(millstone.valid_ds_extensions).forEach(function(i){
    if (millstone.valid_ds_extensions[i] == 'sqlite') {
         extSqlite.push(i);
    } else {
         extFile.push(i);
    }
});

var formatFileSize = function(size) {
    var size = parseInt(size), scaled, suffix;
    if (size >= 1024*1024*1024) {
        scaled = size /(1024*1024*1024);
        suffix = 'GB';
    } else if (size >= 1024*1024) {
        scaled = size/(1024*1024);
        suffix = 'MB';
    } else if (size >= 1024) {
        scaled = size/1024;
        suffix = 'KB';
    } else {
        scaled = size;
        suffix = 'bytes';
    }

    return Math.round(scaled * 100) / 100 + ' ' + suffix;
};

models.Library.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error(new Error('Method not supported.'));


    switch (model.id) {
    case 'file':
    case 'sqlite':

        function isRelative(loc) {
            if (process.platform === 'win32') {
                return loc[0] !== '\\' && loc[0] !== '/' && loc.match(/^[a-zA-Z]:/) === null;
            } else {
                return loc[0] !== '/';
            }
        }

        var sep = process.platform === 'win32' ? '\\' : '/';
        var location = (model.get('location') || process.env.HOME);
        location = location.replace(/^~/, process.env.HOME);
        if (process.platform === 'win32') {
            //https://github.com/mapbox/tilemill/issues/1679
            location = location.replace(/^\\([a-zA-Z]:)/, "$1");
            if (location == '/') {
                var data = {};
                data.id = model.id;
                data.location = location;
                data.assets = _(winDrives()).chain()
                    .map(function(f) {
                        var asset = { name: f };
                        asset.location = f;
                        return asset;
                    })
                    .sortBy(function(f) {return f.name.toLowerCase(); })
                    .value();
                return success(data);
            }
        }
        location = location.replace(/^~/, process.env.HOME);

        // Resolve paths relative to project directory.
        if (isRelative(location)) {
            if (process.env.NODE_ENV === 'development') console.log('[tilemill] [library] detected relative path: ' + location);
            location = path.join(config.files, 'project', model.get('project'), location);
        }

        existsAsync(location, function(exists) {
            if (!exists) {
                if (process.env.NODE_ENV === 'development') console.log('[tilemill] [library] path ' + location + ' not found defaulting to home directory ' + process.env.HOME);
                location = process.env.HOME;
            }
            readdir(location, function(err, files) {
                if (err &&
                    err.code !== 'EACCES' &&
                    err.code !== 'UNKNOWN' &&
                    err.code !== 'EPERM') return error(err);
                var data = {};
                var ext = model.id === 'file' ? extFile : extSqlite;
                data.id = model.id;
                data.location = location;
                data.assets = _(files).chain()
                    .reject(function(f) { return f.basename[0] === '.'; })
                    // Reject Icon? files from Mac OS X. See #917.
                    .reject(function(f) { return f.basename === 'Icon\r'; })
                    .map(function(f) {
                        var asset = { name: f.basename };
                        var filepath = path.join(location, f.basename);
                        if (f.isFile() && _(ext).include(path.extname(f.basename).toLowerCase())) {
                            asset.uri = filepath;
                            return asset;
                        } else if (f.isDirectory()) {
                            asset.location = filepath;
                            return asset;
                        }
                    })
                    .compact()
                    .sortBy(function(f) {return f.name.toLowerCase(); })
                    .value()
                return success(data);
            });
        });
        break;
    case 's3':
        // @TODO:
        var data = {};
        var options = {};
        var ext = extFile;
        data.id = model.id;
        data.location = model.get('location') || '';
        data.assets = [];
        options.bucket = 'mapbox-geodata';
        options.prefix = data.location;
        options.proxy = Bones.plugin.config.httpProxy;
        s3.list(options, function(err, objects) {
            if (err) {
                var msg = "Could not access remote MapBox geodata repository: connecting requires working internet connection";
                if (err.message) msg += ": " + err.message;
                return error(new Error(msg));
            }
            data.assets = _(objects).chain()
                .map(function(obj) {
                    if (!obj.Key && !obj.Prefix) return;

                    var filepath, isFile;
                    if (obj.Key) {
                        filepath = obj.Key[0].text;
                        isFile = true;
                    } else {
                        filepath = obj.Prefix[0].text;
                        isFile = false;
                    }

                    if (isFile && _(ext).include(path.extname(filepath).toLowerCase())) {
                        return {
                            uri: url.format({
                                protocol: 'http:',
                                host: options.bucket + '.s3.amazonaws.com',
                                pathname: filepath
                            }),
                            name: path.basename(filepath),
                            size: formatFileSize(obj.Size[0].text)
                        };
                    } else if (!isFile) {
                        return {
                            location: filepath,
                            name: path.basename(filepath)
                        };
                    }
                })
                .compact()
                .sortBy(function(asset) {
                    var pre = asset.location ? 0 : 1;
                    return pre + asset.name;
                })
                .value();
            return success(data);
        });
        break;
    case 'favoritesFile':
    case 'favoritesSqlite':
    case 'favoritesPostGIS':
        (new models.Favorites({})).fetch({
            success: function(coll, resp) {
                success(coll.toLibrary(model.id));
            },
            error: function(coll, resp) { error(resp); }
        });
        break;
    default:
        return error(new Error('Model not found.'));
    }
};
