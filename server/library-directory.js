var _ = require('underscore'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    Step = require('step');

module.exports = function(app, options, callback) {
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
                        files.push([v, stats[k]]);
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

    var lsFilter = function(files, re) {
        return _.filter(files, function(f) {
            return f[0].match(re);
        });
    };

    var toAssets = function(files, base_dir, port) {
        return _.map(files, function(f) {
            return {
                url: url.format({
                    host: 'localhost:' + port,
                    protocol: 'http:',
                    pathname: path.join(
                        '/api/Library/'
                        + options.id
                        + '/files'
                        + f[0].replace(base_dir, '')
                    )
                }),
                bytes: (Math.ceil(parseInt(f[1].size) / 1048576)) + ' MB',
                id: path.basename(f[0])
            };
        });
    };

    var paginate = function(objects, page, limit) {
        return _.sortBy(objects, function(f) {
            return f.id;
        }).slice(page * limit, page * limit + limit);
    };

    lsR(options.directory_path, function(err, files) {
        var assets = toAssets(
            lsFilter(files, /(.zip|.json|.geojson|.shp|.vrt|.tiff?)/i),
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

