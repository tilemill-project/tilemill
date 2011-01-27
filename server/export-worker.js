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
    Backbone = require('backbone-filesystem'),
    Project = require('project').Project,
    Export = require('project').Export,
    Step = require('step'),
    Tile = require('tilelive').Tile,
    TileBatch = require('tilelive').TileBatch;

// Worker
// ------
// The main worker defined below as well as the export formats **run in a
// different node process** from the main TileMill process. See the
// `export.js` for how workers are created.
worker.onmessage = function (msg) {
    var that = this;
    this.model = new Export({id:msg.id});
    this.model.fetch({
        success: function() {
            // Get the format based on model 'format'.
            // This is set when the export model is first created
            // in `client/app.export.js`.
            var Format = {
                'png': FormatPNG,
                'pdf': FormatPDF,
                'mbtiles': FormatMBTiles
            }[that.model.get('format')];

            // Execute export format.
            new Format(that.model, function() {
                that.postMessage({ complete: true });
            });
        }
    })
};

// Generic export format class.
var Format = function(model, callback) {
    this.model = model;
    this.callback = callback;
    var that = this;
    this.setup(function() {
        that.render(that.callback);
    });
}

Format.prototype.setup = function(callback) {
    var that = this;
    Step(
        function() {
            path.exists(path.join(settings.export_dir, that.model.get('filename')), this);
        },
        function(exists) {
            var filename = that.model.get('filename');
            if (exists) {
                var extension = path.extname(filename);
                var hash = require('crypto').createHash('md5')
                    .update(+new Date).digest('hex').substring(0,6);
                filename = filename.replace(extension, '') + '_' + hash + extension;
            }
            that.model.save({
                status: 'processing',
                updated: +new Date,
                filename: filename
            }, { success: callback, error: callback });
        }
    );
}

// MBTiles export format class.
var FormatMBTiles = function(model, callback) {
    Format.call(this, model, callback);
}
sys.inherits(FormatMBTiles, Format);

FormatMBTiles.prototype.render = function(callback) {
    var batch;
    var that = this;
    var RenderTask = function() {
        process.nextTick(function() {
            batch.renderChunk(function(err, rendered) {
                if (rendered) {
                    that.model.save({
                        progress: batch.tiles_current / batch.tiles_total,
                        updated: +new Date
                    }, { success: RenderTask });
                }
                else {
                    batch.finish();
                    that.model.save({
                        status: 'complete',
                        progress: 1,
                        updated: +new Date
                    }, { success: callback });
                }
            });
        });
    }

    Step(
        function() {
            batch = new TileBatch({
                filepath: path.join(settings.export_dir, that.model.get('filename')),
                batchsize: 100,
                bbox: that.model.get('bbox').split(','),
                minzoom: that.model.get('minzoom'),
                maxzoom: that.model.get('maxzoom'),
                mapfile: that.model.get('mapfile'),
                mapfile_dir: path.join(settings.mapfile_dir),
                metadata: {
                    name: that.model.get('metadata_name'),
                    type: that.model.get('metadata_type'),
                    description: that.model.get('metadata_description'),
                    version: that.model.get('metadata_version')
                }
            });
            batch.setup(this);
        },
        function(err) {
            that.model.save({
                status: 'processing',
                updated: +new Date
            }, { success: RenderTask });
        }
    );
}

// Abstract image export format class.
// Extenders of this class should set `this.format`, e.g. `png`.
var FormatImage = function(model, callback) {
    Format.call(this, model, callback);
}
sys.inherits(FormatImage, Format);

FormatImage.prototype.render = function(callback) {
    var that = this;
    Step(
        function() {
            var options = _.extend({}, that.model.attributes, {
                scheme: 'tile',
                format: that.format,
                mapfile_dir: path.join(settings.mapfile_dir),
                bbox: that.model.get('bbox').split(',')
            });
            try {
                var tile = new Tile(options);
                tile.render(this);
            } catch (err) {
                var next = this;
                that.model.save({
                    status: 'error',
                    error: 'Tile invalid: ' + err.message,
                    updated: +new Date
                }, {
                    success: function() { next(err); },
                    error: function() { next(err); }
                });
            }
        },
        function(err, data) {
            if (!err) {
                fs.writeFile( path.join(settings.export_dir, that.model.get('filename')), data[0], 'binary', function(err) {
                    if (err) {
                        that.model.save({
                            status: 'error',
                            error: 'Error saving image: ' + err.message,
                            updated: +new Date
                        }, { success: callback, error: callback});
                    }
                    else {
                        that.model.save({
                            status:'complete',
                            progress: 1,
                            updated: +new Date
                        }, { success: callback, error: callback});
                    }
                });
            }
            else {
                that.model.save({
                    status: 'error',
                    error: 'Error rendering image: ' + err.message,
                    updated: +new Date
                }, { success: callback, error: callback});
            }
        }
    );
}

// PDF export format class.
var FormatPDF = function(model, callback) {
    this.format = 'pdf';
    FormatImage.call(this, model, callback);
}
sys.inherits(FormatPDF, FormatImage);

// PNG export format class.
var FormatPNG = function(model, callback) {
    this.format = 'png';
    FormatImage.call(this, model, callback);
}
sys.inherits(FormatPNG, FormatImage);

