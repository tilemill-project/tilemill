var fs = require('fs');
var Step = require('step');
var path = require('path');
var read = require('../lib/fsutil.js').read;
var readdir = require('../lib/fsutil.js').readdir;
var mkdirp = require('../lib/fsutil.js').mkdirp;
var rm = require('../lib/fsutil.js').rm;
var config = Bones.plugin.config;

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
        var filepath = path.join(config.files, location);
        readdir(filepath, function(err, files) {
            if (err) return error(err);
            var data = {};
            data.id = model.id;
            data.location = location;
            data.assets = _(files).chain()
                .sortBy(function(f) { return !f.isDirectory(); })
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
        data.id = model.id;
        data.location = 'tilemill-data';
        data.assets = [];
        return success(data);
    case 'favoritesFile':
    case 'favoritesPostGIS':
        var type = model.id.split('favorites').pop().toLowerCase();
        var data = {};
        data.id = model.id;
        data.location = '';
        data.assets = [];

        (new models.Favorites({}, {type:type})).fetch({
            success: function(coll, resp) {
                data.assets = resp;
                success(data);
            },
            error: function(coll, resp) { error(resp); }
        });
        break;
    default:
        return error(new Error('Model not found.'));
    }
};
