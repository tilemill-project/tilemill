// A single worker for processing an export (e.g. rendering a map into an
// MBTiles sqlite database). Workers run in a *different process* from the
// main TileMill node process because:
//
// - export tasks can be long-running (minutes, sometimes hours)
// - export tasks can be CPU intensive, to the point of compromising the
//   responsiveness of the main TileMill process
//
// See the `export.js` for how workers are created.
require.paths.splice(0, require.paths.length);
require.paths.unshift(
    __dirname + '/../lib/node',
    __dirname + '/../server',
    __dirname + '/../shared',
    __dirname + '/../'
);

var worker = require('worker').worker,
    path = require('path'),
    fs = require('fs'),
    sys = require('sys'),
    settings = require('settings'),
    Project = require('models-server').Project,
    Export = require('models-server').Export,
    Step = require('step'),
    Tile = require('tilelive').Tile,
    TileBatch = require('tilelive').TileBatch;

worker.onmessage = function (data) {
    var Format = {
        'png': FormatPNG,
        'pdf': FormatPDF,
        'mbtiles': FormatMBTiles
    }[data.format];
    new Format(this, data);
};

// Generic export format class.
var Format = function(worker, data) {
    _.bindAll(this, 'update', 'complete', 'setup', 'render');
    var that = this;
    this.worker = worker;
    this.data = data;
    Step(
        function() {
            that.setup(this);
        },
        function() {
            that.render(this);
        },
        function() {
            that.complete(this);
        }
    );
}

// Tell the parent process to update the provided `attributes` of Export model.
Format.prototype.update = function(attributes) {
    this.worker.postMessage({ event: 'update', attributes: attributes });
}

// Tell the parent process that the export task is complete.
Format.prototype.complete = function() {
    this.worker.postMessage({ event: 'complete' });
}

// Setup tasks before processing begins. Ensures that the target export
// filename does not conflict with an existing file by appending a short hash
// if necessary.
Format.prototype.setup = function(callback) {
    var that = this;
    Step(
        function() {
            path.exists(path.join(settings.export_dir, that.data.filename), this);
        },
        function(exists) {
            if (exists) {
                var extension = path.extname(that.data.filename);
                var hash = require('crypto')
                    .createHash('md5')
                    .update(+new Date)
                    .digest('hex')
                    .substring(0,6);
                that.data.filename = that.data.filename.replace(extension, '') + '_' + hash + extension;
            }
            that.update({
                status: 'processing',
                updated: +new Date,
                filename: that.data.filename
            });
            callback();
        }
    );
}

// MBTiles format
// --------------
// Exports a map into an MBTiles sqlite database. Renders and inserts tiles in
// batches of 100 images and updates the parent process on its progress after
// each batch.
var FormatMBTiles = function(worker, data) {
    Format.call(this, worker, data);
}
sys.inherits(FormatMBTiles, Format);

FormatMBTiles.prototype.render = function(callback) {
    var batch;
    var that = this;
    var RenderTask = function() {
        process.nextTick(function() {
            batch.renderChunk(function(err, rendered) {
                if (rendered) {
                    that.update({
                        progress: batch.tiles_current / batch.tiles_total,
                        updated: +new Date
                    });
                    RenderTask();
                }
                else {
                    batch.finish();
                    that.update({
                        status: 'complete',
                        progress: 1,
                        updated: +new Date
                    });
                    callback();
                }
            });
        });
    }

    Step(
        function() {
            batch = new TileBatch({
                filepath: path.join(settings.export_dir, that.data.filename),
                batchsize: 100,
                bbox: that.data.bbox.split(','),
                format: that.data.tile_format,
                minzoom: that.data.minzoom,
                maxzoom: that.data.maxzoom,
                mapfile: that.data.mapfile,
                mapfile_dir: path.join(settings.mapfile_dir),
                metadata: {
                    name: that.data.metadata_name,
                    type: that.data.metadata_type,
                    description: that.data.metadata_description,
                    version: that.data.metadata_version
                }
            });
            batch.setup(this);
        },
        function(err) {
            that.update({
                status: 'processing',
                updated: +new Date
            });
            RenderTask();
        }
    );
}

// Image format
// ------------
// Abstract image class. Exports a map into a single image file. Extenders of
// this class should set:
//
// - `this.format` String image format, e.g. `png`.
var FormatImage = function(worker, data) {
    Format.call(this, worker, data);
}
sys.inherits(FormatImage, Format);

FormatImage.prototype.render = function(callback) {
    var that = this;
    Step(
        function() {
            var options = _.extend({}, that.data, {
                scheme: 'tile',
                format: that.format,
                mapfile_dir: path.join(settings.mapfile_dir),
                bbox: that.data.bbox.split(',')
            });
            try {
                var tile = new Tile(options);
                tile.render(this);
            } catch (err) {
                that.update({
                    status: 'error',
                    error: 'Tile invalid: ' + err.message,
                    updated: +new Date
                });
                this();
            }
        },
        function(err, data) {
            if (!err) {
                fs.writeFile( path.join(settings.export_dir, that.data.filename), data[0], 'binary', function(err) {
                    that.update({
                        status: err ? 'error' : 'complete',
                        error: err ? 'Error saving image: ' + err.message : '',
                        progress: err ? 0 : 1,
                        updated: +new Date
                    });
                    callback();
                });
            } else {
                that.update({
                    status: 'error',
                    error: 'Error rendering image: ' + err.message,
                    updated: +new Date
                });
                callback();
            }
        }
    );
}

// PDF export format class.
var FormatPDF = function(worker, data) {
    this.format = 'pdf';
    FormatImage.call(this, worker, data);
}
sys.inherits(FormatPDF, FormatImage);

// PNG export format class.
var FormatPNG = function(worker, data) {
    this.format = 'png';
    FormatImage.call(this, worker, data);
}
sys.inherits(FormatPNG, FormatImage);

