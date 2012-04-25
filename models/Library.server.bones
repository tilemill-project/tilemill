var fs = require('fs');
var Step = require('step');
var path = require('path');
var read = require('../lib/fsutil').read;
var readdir = require('../lib/fsutil').readdir;
var mkdirp = require('../lib/fsutil').mkdirp;
var rm = require('../lib/fsutil').rm;
var s3 = require('../lib/s3');
var config = Bones.plugin.config;
var url = require('url');

// Extensions supported by TileMill. See `millstone.resolve()` for
// the source of this list.
var extFile = [
    '.zip', '.shp', '.png', '.geotiff', '.geotif', '.tiff',
    '.tif', '.vrt', '.kml', '.geojson', '.json', '.rss',
    '.csv', '.tsv', '.txt'
];
// Sqlite extensions.
var extSqlite = [ '.sqlite', '.db', '.sqlite3', '.spatialite' ];

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
        var sep = process.platform === 'win32' ? '\\' : '/';
        var location = (model.get('location') || process.env.HOME)
            .replace(/^([a-zA-Z]:\\|\/)/, sep);

        // Resolve paths relative to project directory.
        if (!location[0] === sep) {
            location = path.join(config.files, 'project', model.get('project'), location);
        }

        path.exists(location, function(exists) {
            if (!exists) location = process.env.HOME;
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
                    .sortBy(function(f) {
                        var pre = f.isDirectory() ? 0 : 1;
                        return pre + f.basename;
                    })
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
        s3.list(options, function(err, objects) {
            if (err) return error(err);
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
