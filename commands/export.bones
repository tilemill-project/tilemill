var fs = require('fs');
var url = require('url');
var path = require('path');
var request = require('request');
var crypto = require('crypto');
var Step = require('step');

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
    var cmd = this;
    var model = new models.Project({id:plugin.argv._[1]});
    Step(function() {
        Bones.utils.fetch({model:model}, this);
    }, function(err) {
        if (err) throw err;
        model.localize(model.toJSON(), this);
    }, function(err) {
        if (err) return cmd.error(err);

        model.mml = _(model.mml).extend({
            name: model.mml.name || model.id,
            version: model.mml.version || '1.0.0',
            minzoom: !_(opts.minzoom).isUndefined() ? opts.minzoom : model.get('minzoom'),
            maxzoom: !_(opts.maxzoom).isUndefined() ? opts.maxzoom : model.get('maxzoom'),
            bounds: !_(opts.bbox).isUndefined() ? opts.bbox : model.get('bounds')
        });

        // Unset map center if outside bounds.
        var validCenter = (function(center, bounds, minzoom, maxzoom) {
            if (center[0] < bounds[0] ||
                center[0] > bounds[2] ||
                center[1] < bounds[1] ||
                center[1] > bounds[3]) return false;
            if (center[2] < minzoom) return false;
            if (center[2] > maxzoom) return false;
            return true;
        })(model.mml.center, model.mml.bounds, model.mml.minzoom, model.mml.maxzoom);
        if (!validCenter) delete model.mml.center;

        cmd[opts.format](model, callback);
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

command.prototype.remaining = function(progress, started) {
    return Math.floor(
        (Date.now() - started) * (1 / progress) -
        (Date.now() - started)
    );
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
    var cmd = this;
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
    var source;
    var sink;

    Step(function() {
        tilelive.load(uri, this);
    }, function(err, s) {
        if (err) throw err;
        source = s;
        tilelive.load('mbtiles://' + cmd.opts.filepath, this);
    }, function(err, s) {
        if (err) throw err;
        sink = s;
        sink.startWriting(this);
    }, function(err) {
        if (err) throw err;
        sink.putInfo(project.mml, this);
    }, function(err) {
        if (err) return cmd.error(err);

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
            cmd.put({
                status: progress < 1 ? 'processing' : 'complete',
                progress: progress,
                remaining: cmd.remaining(progress, copy.started),
                updated: +new Date(),
            });
        }, 5000);

        copy.on('warning', function(err) {
            console.log(err);
        });
        copy.on('finished', function() {
            clearTimeout(timeout);
            cmd.put({
                status: 'complete',
                progress: 1,
                updated: +new Date()
            }, process.exit);
        });
        copy.on('error', function(err) {
            clearTimeout(timeout);
            cmd.error(err);
        });
    });
};

command.prototype.upload = function (project, callback) {
    var cmd = this;
    var hash = crypto.createHash('md5')
        .update(+new Date + '')
        .digest('hex')
        .substring(0, 6);
    var policyEndpoint = url.format({
        protocol: 'http:',
        host: this.opts.mapboxHost || 'api.tiles.mapbox.com',
        pathname: '/v2/'+ hash + '/upload.json'
    });

    Step(function() {
        request.get({
            uri: policyEndpoint,
            headers: { 'Host': url.parse(policyEndpoint).host }
        }, this);
    }, function(err, resp, body) {
        if (err) throw err;
        if (resp.statusCode !== 200)
            throw new Error('MapBox Hosting is not available. Status ' + resp.statusCode + '.');
        try {
            var uploadArgs = JSON.parse(body);
        } catch (e) {
            throw new Error('Failed to parse policy from MapBox Hosting.');
        }
        try {
            var stat = fs.statSync(cmd.opts.filepath);
        } catch(err) { throw err }

        var bucket = uploadArgs.bucket;
        delete uploadArgs.bucket;
        delete uploadArgs.filename;

        var boundry = '----TileMill' + crypto.createHash('md5')
            .update(+new Date + '')
            .digest('hex')
            .substring(0, 6);

        var filename = path.basename(cmd.opts.filepath);

        var multipartBody = new Buffer(_(uploadArgs).map(function(value, key) {
            return '--' + boundry + '\r\n'
                + 'Content-Disposition: form-data; name="' + key + '"\r\n'
                + '\r\n' + value + '\r\n';
            })
            .concat(['--' + boundry + '\r\n'
                + 'Content-Disposition: form-data; name="file"; filename="' + filename + '"\r\n'
                + 'Content-Type: application/octet-stream\r\n\r\n'])
            .join(''));
        var terminate = new Buffer('\r\n--' + boundry + '--', 'ascii');

        var options = {
            host: bucket + '.s3.amazonaws.com',
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data; boundary=' + boundry,
                'Content-Length': stat.size + multipartBody.length + terminate.length,
                'X_FILE_NAME': filename
            }
        };
        var dest = http.request(options, function(resp) {
            if (resp.statusCode !== 303)
                return cmd.error(new Error('S3 is not available. Status ' + resp.statusCode + '.'));

            cmd.put({
                status: 'complete',
                progress: 1,
                url: resp.headers.location.split('?')[0],
                updated: +new Date()
            }, process.exit);
        });

        // Write multipart values from memory.
        dest.write(multipartBody, 'ascii');

        // Set up read for MBTiles file.
        var source = fs.createReadStream(cmd.opts.filepath);

        var bytesWritten = 0;
        var started = Date.now();
        var updateProgress = _(function() {
            var progress = bytesWritten / stat.size;
            cmd.put({
                status: 'complete',
                progress: progress,
                status: progress < 1 ? 'processing' : 'complete',
                remaining: cmd.remaining(progress, started),
                updated: +new Date()
            });
        }).chain().bind(this).throttle(5000).value();
        source.on('data', function(chunk) {
            bytesWritten += chunk.length;
            updateProgress();
        });

        source.on('end', function() {
            dest.write(terminate);
            dest.end();
        });

        // Start the upload!
        source.pipe(dest, {end: false});
    });
};
