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
    'description': 'Export format (png|pdf|svg|mbtiles|upload|sync).'
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
    _(this).bindAll('error', 'put', 'complete');

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
    if (!_(['pdf', 'svg', 'png', 'mbtiles', 'upload', 'sync']).include(opts.format))
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
    if (path.existsSync(opts.filepath) && !_(['upload','sync']).include(opts.format)) {
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

    // Upload format does not require loaded project.
    if (opts.format === 'upload') return this[opts.format](this.complete);

    // Load project, localize and call export function.
    var cmd = this;
    var model = new models.Project({id:opts.project});
    Step(function() {
        Bones.utils.fetch({model:model}, this);
    }, function(err) {
        if (err) throw err;
        model.localize(model.toJSON(), this);
    }, function(err) {
        if (err) return cmd.error(err, function() {
            process.exit(1);
        });

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

        cmd[opts.format](model, this.complete);
    });
};

command.prototype.complete = function(err, data) {
    if (err) {
        this.error(err, function() {
            process.exit(1);
        });
    } else {
        data = _(data).defaults({
            status: 'complete',
            progress: 1,
            updated: +new Date()
        });
        this.put(data, process.exit);
    }
};

command.prototype.error = function(err, callback) {
    this.put({
        status: 'error',
        error: err.toString(),
        updated: +new Date()
    }, callback);
};

command.prototype.remaining = function(progress, started) {
    return Math.floor(
        (Date.now() - started) * (1 / progress) -
        (Date.now() - started)
    );
};

command.prototype.put = function(data, callback) {
    callback = callback || function() {};
    data.status == 'error' ?
        console.error(JSON.stringify(data)) :
        console.log(JSON.stringify(data));

    // Allow commands to filter.
    if (this.putFilter) data = this.putFilter(data);

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
        callback();
    } catch(err) {
        callback(err);
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
        if (err) return cmd.error(err, function() {
            process.exit(1);
        });

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

        var done = false;
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
            clearInterval(timeout);
            callback();
        });
        copy.on('error', function(err) {
            clearInterval(timeout);
            callback(err);
        });
    });
};

command.prototype.upload = function (callback) {
    var cmd = this;
    var key;
    var bucket;
    var mapURL = '';
    var freeURL = '';
    var modelURL = '';
    var hash = crypto.createHash('md5')
        .update(+new Date + '')
        .digest('hex')
        .substring(0, 6);
    var policyEndpoint = url.format({
        protocol: 'http:',
        host: this.opts.mapboxHost || 'api.tiles.mapbox.com',
        pathname: '/v2/'+ hash + '/upload.json'
    });

    // Set URLs for account uploads.
    if (this.opts.syncAccount && this.opts.syncAccessToken) {
        mapURL = _('<%=base%>/<%=account%>/map/<%=handle%>')
            .template({
                base: this.opts.syncURL,
                account: this.opts.syncAccount,
                handle: this.opts.project
            });
        modelURL = _('<%=base%>/api/Map/<%=account%>.<%=handle%>?access_token=<%=token%>')
            .template({
                base: this.opts.syncURL,
                account: this.opts.syncAccount,
                handle: this.opts.project,
                token: this.opts.syncAccessToken
            });
    }

    Step(function() {
        request.get({
            uri: policyEndpoint,
            headers: { 'Host': url.parse(policyEndpoint).host }
        }, this);
    }, function(err, resp, body) {
        if (err) throw err;
        if (resp.statusCode !== 200)
            throw new Error('MapBox Hosting is not available. Status ' + resp.statusCode + '.');

        // Let Step catch thrown errors here.
        uploadArgs = JSON.parse(body);
        key = uploadArgs.key;
        bucket = uploadArgs.bucket;
        delete uploadArgs.bucket;
        delete uploadArgs.filename;

        var stat = fs.statSync(cmd.opts.filepath);
        var boundary = '----TileMill' + crypto.createHash('md5')
            .update(+new Date + '')
            .digest('hex')
            .substring(0, 6);
        var filename = path.basename(cmd.opts.filepath);
        var multipartBody = new Buffer(_(uploadArgs).map(function(value, key) {
            return '--' + boundary + '\r\n'
                + 'Content-Disposition: form-data; name="' + key + '"\r\n'
                + '\r\n' + value + '\r\n';
            })
            .concat(['--' + boundary + '\r\n'
                + 'Content-Disposition: form-data; name="file"; filename="' + filename + '"\r\n'
                + 'Content-Type: application/octet-stream\r\n\r\n'])
            .join(''));
        var terminate = new Buffer('\r\n--' + boundary + '--', 'ascii');

        var dest = http.request({
            host: bucket + '.s3.amazonaws.com',
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
                'Content-Length': stat.size + multipartBody.length + terminate.length,
                'X_FILE_NAME': filename
            }
        });
        dest.on('response', function(resp) {
            var data = '';
            var callback = function(err) {
                if (err) {
                    return this(new Error('Connection terminated. Code ' + err.code));
                }
                if (resp.statusCode !== 303) {
                    var parsed = _({
                        code:     new RegExp('[^>]+(?=<\\/Code>)', 'g'),
                        message:  new RegExp('[^>]+(?=<\\/Message>)', 'g')
                    }).reduce(function(memo, pattern, key) {
                        memo[key] = data.match(pattern) || [];
                        return memo;
                    }, {});
                    var message = 'Error: S3 upload failed. Status: ' + resp.statusCode;
                    if (parsed.code[0] && parsed.message[0])
                        message += ' (' + parsed.code[0] + ' - ' + parsed.message[0] + ')';
                    return this(new Error(message));
                }
                freeURL = resp.headers.location.split('?')[0];
                this();
            }.bind(this);
            resp.on('data', function(chunk) { chunk += data; });
            resp.on('close', callback);
            resp.on('end', callback);
        }.bind(this));

        // Write multipart values from memory.
        dest.write(multipartBody, 'ascii');

        // Set up read for MBTiles file and start the upload.
        var bytesWritten = 0;
        var started = Date.now();
        var updated = Date.now();
        fs.createReadStream(cmd.opts.filepath)
            .on('data', function(chunk) {
                bytesWritten += chunk.length;

                if (Date.now() < updated + 5000) return;

                var progress = bytesWritten / stat.size;
                updated = Date.now();
                cmd.put({
                    progress: progress,
                    status: progress < 1 ? 'processing' : 'complete',
                    remaining: cmd.remaining(progress, started),
                    updated: updated
                });
            })
            .on('end', function() {
                dest.write(terminate);
                dest.end();
            })
            .pipe(dest, {end: false});
    }, function(err) {
        if (err) throw err;
        if (!modelURL) return this(); // Free

        request.get(modelURL, this);
    }, function(err, res, body) {
        if (err) throw err;
        if (!modelURL) return this(); // Free

        // Let Step catch thrown errors here.
        var model = _(res.statusCode === 404 ? {} : JSON.parse(body)).extend({
            id: cmd.opts.syncAccount + '.' + cmd.opts.project,
            _type: 'tileset',
            created: +new Date,
            status: 'pending',
            url: 'http://' + bucket + '.s3.amazonaws.com/' + key
        });
        request.put({ url:modelURL, json:model }, this);
    }, function(err, res, body) {
        if (err)
            return callback(err);
        if (modelURL && res.statusCode !== 200)
            return callback(new Error('Map publish failed: ' + res.statusCode));
        callback(null, { url:modelURL ? mapURL : freeURL });
    });
};

command.prototype.sync = function (project, callback) {
    var cmd = this;
    var modifier = 0;
    cmd.putFilter = function(data) {
        if (!data.progress) return data;
        data.progress = (data.progress*0.5) + modifier;
        return data;
    };
    cmd.opts.filepath = _('/tmp/tm-sync-<%=id%>-<%=time%>.mbtiles').template({
        id: project.id,
        time: + new Date
    });
    Step(function() {
        cmd.mbtiles(project, this);
    }, function(err) {
        if (err) throw err;
        modifier = 0.5;
        cmd.upload(this);
    }, function(err, data) {
        fs.unlinkSync(cmd.opts.filepath);
        cmd.complete(err, data);
    });
};

