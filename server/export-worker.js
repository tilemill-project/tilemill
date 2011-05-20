// A single worker for processing an export (e.g. rendering a map into an
// MBTiles sqlite database). Workers run in a *different process* from the
// main TileMill node process because:
//
// - export tasks can be long-running (minutes, sometimes hours)
// - export tasks can be CPU intensive, to the point of compromising the
//   responsiveness of the main TileMill process
//
// See the `export.js` for how workers are created.
var _ = require('underscore'),
    worker = require('worker').worker,
    path = require('path'),
    fs = require('fs'),
    settings = require('../settings');

worker.onmessage = function(data) {
    var formats = {
        png: renderImage,
        pdf: renderImage,
        mbtiles: renderMBTiles
    };
    if (!formats[data.format]) {
        worker.postMessage({event:'update', attributes: {
            status: 'error',
            error: 'Invalid format.',
            updated: +new Date()
        }});
        worker.postMessage({event:'complete'});
        return;
    }

    // Rename the output filepath using a random hash if file already exists.
    data.filepath = path.join(settings.export_dir, data.filename);
    if (path.existsSync(data.filepath)) {
        var hash = require('crypto')
            .createHash('md5')
            .update(+new Date + '')
            .digest('hex')
            .substring(0, 6);
        var extension = path.extname(data.filename);
        data.filename = data.filename.replace(
            extension,
            '_' + hash + extension
        );
        data.filepath = data.filepath.replace(
            extension,
            '_' + hash + extension
        );
    }
    worker.postMessage({event:'update', attributes: {
        status: 'processing',
        updated: +new Date,
        filename: data.filename
    }});
    formats[data.format](data, function(err) {
        err && worker.postMessage({event:'update', attributes: {
            status: 'error',
            error: err.toString(),
            updated: +new Date()
        }});
        worker.postMessage({event:'complete'});
    });
};

var renderImage = function(data, callback) {
    var sm = new (require('tilelive').SphericalMercator);
    var map = new (require('tilelive-mapnik').Map)(data.datasource, data);
    _(data).extend({
        mapfile_dir: path.join(settings.mapfile_dir),
        bbox: sm.convert(data.bbox.split(','), '900913')
    });

    map.initialize(function(err) {
        if (err) return callback(err);
        map.render(data, function(err, render) {
            if (err) return callback(err);
            fs.writeFileSync(data.filepath, render[0], 'binary');
            worker.postMessage({event:'update', attributes: {
                status: 'complete',
                progress: 1,
                updated: +new Date
            }});
            callback();
        }.bind(this));
    }.bind(this));
};

var renderMBTiles = function(data, callback) {
    var batch = new (require('tilelive').Batch)({
        renderer: require('tilelive-mapnik'),
        storage: require('mbtiles'),
        filepath: data.filepath,
        bbox: data.bbox.split(','),
        format: data.tile_format,
        // @TODO: probably should be at `serve` key.
        // interactivity: that.data.interactivity,
        minzoom: data.minzoom,
        maxzoom: data.maxzoom,
        datasource: data.datasource,
        metadata: {
            name: data.metadata_name,
            type: data.metadata_type,
            description: data.metadata_description,
            version: data.metadata_version,
            formatter: data.metadata_formatter
        }
    });

    batch.on('write', function(batch) {
        worker.postMessage({event:'update', attributes: {
            status: 'processing',
            progress: batch.tilesCurrent / batch.tilesTotal,
            updated: +new Date()
        }});
    }.bind(this));

    batch.on('end', function(batch) {
        worker.postMessage({event:'update', attributes: {
            status: 'complete',
            progress: 1,
            updated: +new Date()
        }});
        callback();
    }.bind(this));

    batch.on('error', function(batch, err) {
        callback(err);
    }.bind(this));

    batch.execute();
};

