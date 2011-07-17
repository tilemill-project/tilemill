var fs = require('fs');
var url = require('url');
var path = require('path');
var request = require('request');

command = Bones.Command.extend();

command.description = 'export project';
command.usage = '<datasource> <export>';

command.options['format'] = {
    'title': 'format=[format]',
    'description': 'Export format (png|pdf|mbtiles).'
};

command.options['bbox'] = {
    'title': 'bbox=[bbox]',
    'description': 'Comma separated coordinates of bounding box to export.',
    'default': '-180,-90,180,90'
};

command.options['minzoom'] = {
    'title': 'minzoom=[zoom]',
    'description': 'MBTiles: minimum zoom level to export.',
    'default': 0
};

command.options['maxzoom'] = {
    'title': 'maxzoom=[zoom]',
    'description': 'MBTiles: maximum zoom level to export.',
    'default': 4
};

command.options['width'] = {
    'title': 'width=[width]',
    'description': 'Image: image width in pixels.',
    'default': 400
};

command.options['height'] = {
    'title': 'height=[height]',
    'description': 'Image: image height in pixels.',
    'default': 400
};

command.options['url'] = {
    'title': 'url=[url]',
    'description': 'URL to PUT updates to.'
};

command.prototype.initialize = function(plugin, callback) {
    var opts = plugin.config;
    opts.datasource = plugin.argv._[1];
    opts.filepath = plugin.argv._[2];
    callback = callback || function() {};
    this.opts = opts;

    // Validation.
    if (!opts.datasource || !opts.filepath) return plugin.help();
    if (!path.existsSync(opts.datasource))
        return this.error(new Error('Project path does not exist: ' + opts.datasource));
    if (!path.existsSync(path.dirname(opts.filepath)))
        return this.error(new Error('Export path does not exist: ' + path.dirname(opts.filepath)));

    // Format.
    if (!opts.format) opts.format = path.extname(opts.filepath).split('.').pop();
    if (!_(['pdf', 'png', 'mbtiles']).include(opts.format))
        return this.error(new Error('Invalid format: ' + opts.format));

    // Convert string params into numbers.
    if (!_(opts.bbox).isUndefined())
        opts.bbox = _(opts.bbox.split(',')).map(parseFloat);
    if (!_(opts.minzoom).isUndefined())
        opts.minzoom = parseInt(opts.minzoom, 10);
    if (!_(opts.maxzoom).isUndefined())
        opts.maxzoom = parseInt(opts.maxzoom, 10);
    if (!_(opts.width).isUndefined())
        opts.width = parseInt(opts.width, 10);
    if (!_(opts.height).isUndefined())
        opts.height = parseInt(opts.height, 10);

    // Rename the output filepath using a random hash if file already exists.
    if (path.existsSync(opts.filepath)) {
        var hash = require('crypto')
            .createHash('md5')
            .update(+new Date + '')
            .digest('hex')
            .substring(0, 6);
        var ext = path.extname(opts.filepath);
        opts.filepath = opts.filepath.replace(ext, '_' + hash + ext);

        // Update filename in TileMill.
        this.put({ filename: path.basename(opts.filepath) });
    }

    // Set process title.
    process.title = 'tm-' + path.basename(opts.filepath);

    // Kickoff export function.
    this[opts.format](opts, callback);

    // Catch SIGINT.
    process.on('SIGINT', function () {
      console.log('Got SIGINT. Press Control-D to exit.');
    });
    process.on('SIGUSR1', process.exit);
};

command.prototype.error = function(err) {
    this.put({
        status: 'error',
        error: err.toString(),
        updated: +new Date()
    });
    console.error(err);
};

command.prototype.put = function(data, callback) {
    callback = callback || function() {};
    if (!this.opts.url) return callback();
    request.put({
        uri: this.opts.url,
        headers: {
            'Host': url.parse(this.opts.url).host,
            'Cookie': 'bones.token=token'
        },
        json: _(data).extend({'bones.token': 'token'})
    }, callback);
};

command.prototype.png =
command.prototype.pdf = function(data, callback) {
    this.put({
        status: 'processing',
        updated: + new Date()
    });

    var sm = new (require('tilelive').SphericalMercator);
    var map = new (require('tilelive-mapnik').Map)(data.datasource, data);
    data.bbox = sm.convert(data.bbox, '900913');
    map.initialize(function(err) {
        if (err) return callback(err);
        map.render(data, function(err, render) {
            if (err) {
                this.error(err);
                callback();
            } else {
                fs.writeFileSync(data.filepath, render[0], 'binary');
                this.put({
                    status: 'complete',
                    progress: 1,
                    updated: +new Date()
                });
                callback();
            }
        }.bind(this));
    }.bind(this));
};

command.prototype.mbtiles = function (data, callback) {
    this.put({
        status: 'processing',
        updated: + new Date()
    });

    try {
        var project = JSON.parse(fs.readFileSync(data.datasource));
    } catch(e) { this.error(e); }

    var batch = new (require('tilelive').Batch)({
        renderer: require('tilelive-mapnik'),
        storage: require('mbtiles'),
        filepath: data.filepath,
        bbox: data.bbox,
        format: project.format || 'png',
        // @TODO: probably should be at `serve` key.
        // interactivity: that.data.interactivity,
        minzoom: data.minzoom || project.minzoom || 0,
        maxzoom: data.maxzoom || project.maxzoom || 4,
        datasource: data.datasource,
        // @TODO
        metadata: {
            name: project.name || '',
            description: project.description || '',
            version: project.version || '1.0.0',
            formatter: project.formatter || ''
        }
    });

    batch.on('write', function(batch) {
        this.put({
            status: batch.tilesCurrent >= batch.tilesTotal
                ? 'complete'
                : 'processing',
            progress: batch.tilesCurrent / batch.tilesTotal,
            updated: +new Date()
        });
    }.bind(this));

    batch.on('end', function(batch) {
        this.put({
            status: 'complete',
            progress: 1,
            updated: +new Date()
        });
        callback();
    }.bind(this));

    batch.on('error', function(batch, err) {
        this.error(err);
        callback();
    }.bind(this));

    batch.execute();
};

