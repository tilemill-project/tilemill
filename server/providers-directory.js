var express = require('express'),
    fs = require('fs'),
    url = require('url'),
    _ = require('underscore')._,
    path = require('path');

module.exports = function(app, options, callback) {
    // TODO: now requires absolute paths; change?
    app.get('/provider/directory/file*', function(req, res) {
        // TODO: make path secure!
        res.sendfile(path.join(options.directory_path, req.params[0]),
            function(err, path) {
                if (err) {
                    res.send({
                        status: false
                    });
                }
        });
    });

    function formatbyte(n) {
        return (Math.ceil(parseInt(n) / 1048576)) + ' MB';
    }

    var lsR = function(base_dir) {
        return _.reduce(fs.readdirSync(base_dir), function(memo, item) {
            var p = path.join(base_dir, item);
            var stat = fs.statSync(p);
            if (stat.isDirectory()) {
                var l = lsR(p);
                memo = memo.concat(l);
            } else {
                memo.push([p, stat]);
            }
            return memo;
        }, []);
        return result;
    };

    var lsFilter = function(files, re) {
        return _.filter(files, function(f) {
            return f[0].match(re);
        });
    };

    var toObjects = function(files, base_dir, port) {
        return _.map(files, function(f) {
            return {
                url: url.format({
                    host: 'localhost:' + port,
                    protocol: 'http:',
                    pathname: path.join('/provider/directory/file/',
                        f[0].replace(base_dir, ''))
                }),
                bytes: formatbyte(f[1].size),
                id: path.basename(f[0])
            };
        });
    };

    var paginate = function(objects, page, limit) {
        return _.sortBy(objects, function(f) {
            return f.id;
        }).slice(page * limit, page * limit + limit);
    };

    var objects = toObjects(
        lsFilter(
            lsR(options.directory_path),
            /(.zip|.json|.geojson|.shp|.vrt|.tiff?)/i
        ),
        options.directory_path,
        require('settings').port
    );

    callback({
        models: paginate(
            objects,
            options.page,
            options.limit
        ),
        page: options.page,
        pageTotal: Math.ceil(objects.length / options.limit)
    });
};

