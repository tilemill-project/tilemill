var fs = require('fs');
var url = require('url');
var path = require('path');
var request = require('request');
var crypto = require('crypto');

command = Bones.Command.extend();

command.description = 'export project';
command.usage = '<project> <export>';

command.options['format'] = {
    'title': 'format=[format]',
    'description': 'Export format (png|pdf|svg|mbtiles).'
};

command.options['bbox'] = {
    'title': 'bbox=[bbox]',
    'description': 'Comma separated coordinates of bounding box to export.'
};

command.options['minzoom'] = {
    'title': 'minzoom=[zoom]',
    'description': 'MBTiles: minimum zoom level to export.'
};

command.options['maxzoom'] = {
    'title': 'maxzoom=[zoom]',
    'description': 'MBTiles: maximum zoom level to export.'
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

command.options['log'] = {
    'title': 'log',
    'description': 'Write crash logs to destination directory.'
};

command.prototype.initialize = function(plugin, callback) {
    var opts = plugin.config;
    if (process.env.tilemillConfig)
        _(opts).extend(JSON.parse(process.env.tilemillConfig));
    opts.files = path.resolve(opts.files);
    opts.project = plugin.argv._[1];
    opts.filepath = path.resolve(plugin.argv._[2]);
    callback = callback || function() {};
    this.opts = opts;

    // Write crash log
    if (opts.log) {
        process.on('uncaughtException', function(err) {
            fs.writeFileSync(opts.filepath + '.crashlog', err.stack || err.toString());
            process.exit(1);
        });
    }

    // Validation.
    if (!opts.project || !opts.filepath) return plugin.help();
    if (!path.existsSync(path.dirname(opts.filepath)))
        return this.error(new Error('Export path does not exist: ' + path.dirname(opts.filepath)));

    // Format.
    if (!opts.format) opts.format = path.extname(opts.filepath).split('.').pop();
    if (!_(['pdf', 'svg', 'png', 'mbtiles', 'upload']).include(opts.format))
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
    if (path.existsSync(opts.filepath) && opts.format !== 'upload') {
        var hash = crypto.createHash('md5')
            .update(+new Date + '')
            .digest('hex')
            .substring(0, 6);
        var ext = path.extname(opts.filepath);
        opts.filepath = opts.filepath.replace(ext, '_' + hash + ext);

        // Update filename in TileMill.
        this.put({ filename: path.basename(opts.filepath), status: 'processing' });
    }

    // Set process title.
    process.title = 'tm-' + path.basename(opts.filepath);

    // Catch SIGINT.
    process.on('SIGINT', function () {
        console.log('Got SIGINT. Run "kill ' + process.pid + '" to terminate.');
    });
    process.on('SIGUSR1', process.exit);

    // Load project, localize and call export function.
    (new models.Project({id: plugin.argv._[1] })).fetch({
        success: function(model, resp) {
            model.localize(resp, function(err) {
                if (err) return this.error(err);
                model.mml = _(model.mml).extend({
                    name: model.mml.name || model.id,
                    version: model.mml.version || '1.0.0',
                    minzoom: !_(opts.minzoom).isUndefined() ? opts.minzoom : model.get('minzoom'),
                    maxzoom: !_(opts.maxzoom).isUndefined() ? opts.maxzoom : model.get('maxzoom'),
                    bounds: !_(opts.bbox).isUndefined() ? opts.bbox : model.get('bounds')
                });

                // Unset map center for now given that it may be outside
                // overridden bounds provided.
                if (model.mml.center) delete model.mml.center;

                this[opts.format](model, callback);
            }.bind(this));
        }.bind(this),
        error: function(model, resp) {
            this.error(resp);
        }.bind(this)
    });
};

command.prototype.error = function(err) {
    this.put({
        status: 'error',
        error: err.toString(),
        updated: +new Date()
    });
    console.error(err.toString());
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
command.prototype.svg =
command.prototype.pdf = function(project, callback) {
    var mapnik = require('mapnik');
    var sm = new (require('sphericalmercator'))();
    var map = new mapnik.Map(this.opts.width, this.opts.height);

    map.fromStringSync(project.xml, {
        strict: false,
        base: path.join(this.opts.files, 'project', project.id) + '/'
    });
    map.bufferSize = this.opts.bufferSize;
    map.extent = sm.convert(project.mml.bounds, '900913');
    try {
        map.renderFileSync(this.opts.filepath, { format: this.opts.format });
        this.put({
            status: 'complete',
            progress: 1,
            updated: +new Date()
        }, process.exit);
    } catch(err) {
        this.error(err);
    }
};

command.prototype.mbtiles = function (project, callback) {
    var tilelive = require('tilelive');
    require('mbtiles').registerProtocols(tilelive);
    require('tilelive-mapnik').registerProtocols(tilelive);

    var uri = {
        protocol: 'mapnik:',
        slashes: true,
        xml: project.xml,
        mml: project.mml,
        pathname: path.join(this.opts.files, 'project', project.id, project.id + '.xml'),
        query: { bufferSize: this.opts.bufferSize }
    };
    tilelive.load(uri, function(err, source) {
        if (err) throw err;
        tilelive.load('mbtiles://' + this.opts.filepath, function(err, sink) {
            if (err) throw err;
            sink.startWriting(function(err) {
                if (err) throw err;
                sink.putInfo(project.mml, function(err) {
                    if (err) throw err;
                    var copy = tilelive.copy({
                        source: source,
                        sink: sink,
                        bbox: project.mml.bounds,
                        minZoom: project.mml.minzoom,
                        maxZoom: project.mml.maxzoom,
                        concurrency: 100,
                        tiles: true,
                        grids: !!project.mml.interactivity
                    });

                    var timeout = setInterval(function progress() {
                        var progress = (copy.copied + copy.failed) / copy.total;
                        var remaining = Math.floor((Date.now() - copy.started) * (1 / progress));
                        this.put({
                            status: progress < 1 ? 'processing' : 'complete',
                            progress: progress,
                            remaining: remaining,
                            updated: +new Date(),
                        });
                    }.bind(this), 5000);
                    copy.on('warning', function(err) {
                        console.log(err);
                    }.bind(this));
                    copy.on('finished', function() {
                        clearTimeout(timeout);
                        this.put({
                            status: 'complete',
                            progress: 1,
                            updated: +new Date()
                        }, process.exit);
                    }.bind(this));
                    copy.on('error', function(err) {
                        clearTimeout(timeout);
                        this.error(err);
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

command.prototype.upload = function (project, callback) {
    var hash = crypto.createHash('md5')
        .update(+new Date + '')
        .digest('hex')
        .substring(0, 6);
    var policyEndpoint = url.format({
        protocol: 'http:',
        host: this.opts.mapboxHost || 'tiles.mapbox.com',
        pathname: '/v2/'+ hash + '/upload.json'
    });

    request.get({
        uri: policyEndpoint,
        headers: {
            'Host': url.parse(policyEndpoint).host,
        }
    }, _(function(err, resp, body) {
        if (err) return this.error(err);
        if (resp.statusCode !== 200) return this.error(
            new Error('MapBox Hosting is not available. Status '
                      + resp.statusCode + '.'));

        try {
            var uploadArgs = JSON.parse(body);
        } catch (e) {
            this.error(new Error('Failed to parse policy from MapBox Hosting.'));
        }

        var bucket = uploadArgs.bucket;
        delete uploadArgs.bucket;
        delete uploadArgs.filename;

        var filename = path.basename(this.opts.filepath);
        // Write multipart body post to a temporary file. Fix this once piping
        // works better.
        var tmpPath = '/tmp/' + filename + '.post';
        var dest = fs.createWriteStream(tmpPath);

        var boundry = '----TileMill' + crypto.createHash('md5')
            .update(+new Date + '')
            .digest('hex')
            .substring(0, 6);

        var body = '';
        _(uploadArgs).each(function(arg, key) {
            body += '--' + boundry + '\r\n';
            body += 'Content-Disposition: form-data; name="' + key + '"\r\n',
            body += '\r\n' + arg + '\r\n';
        });

        body += '--' + boundry + '\r\n';
        body += 'Content-Disposition: form-data; name="file"; filename="' +
            path.basename(this.opts.filepath) + '"\r\n'
        body += 'Content-Type: application/octet-stream\r\n\r\n';
        dest.write(body, 'ascii');

        var source = fs.createReadStream(this.opts.filepath);
        source.on('end', function() {
            dest.end('\r\n--' + boundry + '--', 'ascii');
        });
        source.pipe(dest, {end: false});

        dest.on('close', _(function() {
            // Temporary file has been closed. Time to upload.
            fs.stat(tmpPath, _(function(err, stat) {
                if (err) return this.error(err);
                var options = {
                    uri: 'http://' + bucket + '.s3.amazonaws.com/',
                    headers: {
                        'Content-Type': 'multipart/form-data; boundary=' + boundry,
                        'Content-Length': stat.size,
                        'X_FILE_NAME': filename
                    }
                };
                var source = fs.createReadStream(tmpPath);
                var dest = request.post(options, _(function(err, resp) {
                    if (err) return this.error(err);
                    fs.unlink(tmpPath, _(function(err) {
                        if (err) return this.error(err);
                        this.put({
                            status: 'complete',
                            progress: 1,
                            url: resp.headers.location.split('?')[0],
                            updated: +new Date()
                        }, process.exit);
                    }).bind(this));
                }).bind(this));

                // Start the upload!
                source.pipe(dest);

            }).bind(this));
        }).bind(this));
    }).bind(this));
};
