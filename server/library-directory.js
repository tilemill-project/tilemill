// Plugin for using a local directory as a Library. Generates the payload for
// an AssetList REST endpoint consisting of asset models as well as pagination
// helpers.
var _ = require('underscore'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    querystring = require('querystring'),
    Step = require('step');

module.exports = function(app, options, callback) {
    // Recursive readdir. `callback(err, files)` is given a `files` array where
    // each file is an object with `filename` and `stat` properties.
    var lsR = function(basedir, callback) {
        var files = [];
        var ls = [];
        Step(
            function() {
                fs.readdir(basedir, this);
            },
            function(err, data) {
                if (data.length === 0) return this();

                var group = this.group();
                ls = _.map(data, function(v) {
                    return path.join(basedir, v);
                });
                _.each(ls, function(v) {
                    fs.stat(v, group());
                });
            },
            function(err, stats) {
                if (ls.length === 0) return this();

                var group = this.group();
                _.each(ls, function(v, k) {
                    var next = group();
                    if (stats[k].isDirectory()) {
                        lsR(v, next);
                    } else {
                        files.push({
                            filename: v,
                            stat: stats[k]
                        });
                        next();
                    }
                });
            },
            function(err, sub) {
                _.each(sub, function(v) {
                    v && (files = files.concat(v));
                });
                callback(err, files);
            }
        );
    }

    // Filter an array of files where filenames match regex `re`.
    var lsFilter = function(files, re) {
        return _.filter(files, function(f) {
            return f.filename.match(re);
        });
    };

    // Convert a list of files into asset models.
    var toAssets = function(files, base_dir, port) {
        return _.map(files, function(f) {
            return {
                url: url.format({
                    host: 'localhost:' + port,
                    protocol: 'http:',
                    pathname: path.join(
                        '/api/Library/'
                        + options.id
                        + '/files/'
                        // Ensure only one trailing slash
                        + querystring.escape(f.filename.replace(
                          base_dir.replace(/(\/)$/, '') + '/', ''))
                    )
                }),
                bytes: (Math.ceil(parseInt(f.stat.size) / 1048576)) + ' MB',
                id: path.basename(f.filename)
            };
        });
    };

    // Sort and slice to the specified page.
    var paginate = function(objects, page, limit) {
        return _.sortBy(objects, function(f) {
            return f.id;
        }).slice(page * limit, page * limit + limit);
    };

    // Generate the AssetList payload object.
    lsR(options.directory_path, function(err, files) {
        var assets = toAssets(
            lsFilter(files, /\.(zip|json|geojson|vrt|tiff?)$/i),
            options.directory_path,
            require('settings').port
        );
        callback({
            models: paginate(
                assets,
                options.page,
                options.limit
            ),
            page: options.page,
            pageTotal: Math.ceil(assets.length / options.limit)
        });
    });
};

