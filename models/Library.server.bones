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

// Extensions supported by TileMill. See `carto/lib/carto/external.js` for
// the source of this list.
var ext = [
    '.zip', '.shp', '.png', '.geotiff', '.geotif', '.tiff',
    '.tif', '.vrt', '.kml', '.geojson', '.json', '.rss'
];

models.Library.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error(new Error('Method not supported.'));

    switch (model.id) {
    case 'file':
        // @TODO: disallow .. and other nasty things.
        var location = model.get('location') || '/';
        var filepath = path.join(config.files, 'data', location);
        readdir(filepath, function(err, files) {
            if (err) return error(err);
            var data = {};
            data.id = model.id;
            data.location = location;
            data.assets = _(files).chain()
                .sortBy(function(f) {
                    var pre = f.isDirectory() ? 0 : 1;
                    return pre + f.basename;
                })
                .map(function(f) {
                    var asset = { name: f.basename };
                    var local = path.join(location, f.basename);
                    var uri = path.join(filepath, f.basename);
                    if (f.isFile() && _(ext).include(path.extname(f.basename))) {
                        asset.uri = uri;
                        return asset;
                    } else if (f.isDirectory()) {
                        asset.location = local;
                        return asset;
                    }
                })
                .compact()
                .value()
            return success(data);
        });
        break;
    case 's3':
        // @TODO:
        var data = {};
        var options = {};
        data.id = model.id;
        data.location = model.get('location') || '';
        data.assets = [];
        options.bucket = 'tilemill-data';
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

                    if (isFile && _(ext).include(path.extname(filepath))) {
                        return {
                            uri: url.format({
                                protocol: 'http:',
                                host: options.bucket + '.s3.amazonaws.com',
                                pathname: filepath
                            }),
                            name: path.basename(filepath)
                        };
                    } else if (!isFile) {
                        return { location: filepath, name: filepath };
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
