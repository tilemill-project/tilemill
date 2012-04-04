var fs = require('fs');
var url = require('url');
var path = require('path');
var request = require('request');
var crypto = require('crypto');
var util = require('util');
var Step = require('step');
var http = require('http');
var chrono = require('chrono');

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

command.options['quiet'] = {
    'title': 'quiet',
    'description': 'Suppresses progress output.'
};

command.options['scheme'] = {
    'title': 'scheme=[scanline|pyramid|file]',
    'description': 'Enumeration scheme that defines the order in which tiles will be rendered.',
    'default': 'scanline'
};

command.options['job'] = {
    'title': 'job=[file]',
    'description': 'Store state in this file. If it exists, that job will be resumed.',
    'default': false
};

command.options['list'] = {
    'title': 'list=[file]',
    'description': 'Provide a list file for filescheme render.',
    'default': false
};

command.options['metatile'] = {
    'title': 'metatile=[num]',
    'description': 'Metatile size.',
    'default': 2
};

command.options['concurrency'] = {
    'title': 'concurrency=[num]',
    'description': 'Number of exports that can be run concurrently.',
    'default': 4
};

command.prototype.initialize = function(plugin, callback) {
    _(this).bindAll('error', 'put', 'complete');

    var opts = plugin.config;
    if (process.env.tilemillConfig)
        _(opts).extend(JSON.parse(process.env.tilemillConfig));
    opts.files = path.resolve(opts.files);
    opts.project = plugin.argv._[1];
    if (!plugin.argv._[2]) return plugin.help();
    opts.filepath = path.resolve(plugin.argv._[2]);
    callback = callback || function() {};
    this.opts = opts;

    // Write crash log
    if (opts.log) {
        process.on('uncaughtException', function(err) {
            fs.writeFileSync(opts.filepath + '.crashlog', err.stack || err.toString());
        });
    }

    // Validation.
    if (!opts.project || !opts.filepath) return plugin.help();
    if (!path.existsSync(path.dirname(opts.filepath)))
        return this.error(new Error('Export path does not exist: ' + path.dirname(opts.filepath)));

    // Format.
    if (!opts.format) opts.format = path.extname(opts.filepath).split('.').pop();

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
    if (!_(opts.metatile).isUndefined())
        opts.metatile = parseInt(opts.metatile, 10);

    // Rename the output filepath using a random hash if file already exists.
    if (path.existsSync(opts.filepath) &&
        _(['png','pdf','svg','mbtiles']).include(opts.format)) {
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
        if (!cmd.opts.quiet) process.stderr.write('Loading project...');
        Bones.utils.fetch({model:model}, this);
    }, function(err) {
        if (err) return cmd.error(err, function() {
            process.stderr.write(err.stack + '\n');
            process.exit(1);
        });
        if (!cmd.opts.quiet) process.stderr.write(' done.\n');
        // Set the postgres connection pool size to # of cpus based on
        // assumption of pool size in tilelive-mapnik.
        model.get('Layer').each(function(l) {
            if (l.attributes.Datasource && l.attributes.Datasource.dbname)
                l.attributes.Datasource.max_size = require('os').cpus().length;
        });
        if (!cmd.opts.quiet) process.stderr.write('Localizing project...');
        model.localize(model.toJSON(), this);
    }, function(err) {
        if (err) return cmd.error(err, function() {
            process.exit(1);
        });

        if (!cmd.opts.quiet) process.stderr.write(' done.\n');
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

        switch (opts.format) {
        case 'png':
        case 'svg':
        case 'pdf':
            cmd.image(model, cmd.complete);
            break;
        case 'upload':
            cmd.upload(model, cmd.complete);
            break;
        case 'sync':
            cmd.sync(model, cmd.complete);
            break;
        default:
            cmd.tilelive(model, cmd.complete);
            break;
        }
    });
};

command.prototype.complete = function(err, data) {
    if (err) {
        this.error(err, function() {
            process.exit(1);
        });
    } else {
        data = _(data||{}).defaults({
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


function formatDuration(duration) {
    duration = duration / 1000 | 0;
    var seconds = duration % 60;
    duration -= seconds;
    var minutes = (duration % 3600) / 60;
    duration -= minutes * 60;
    var hours = (duration % 86400) / 3600;
    duration -= hours * 3600;
    var days = duration / 86400;

    return (days > 0 ? days + 'd ' : '') +
           (hours > 0 || days > 0 ? hours + 'h ' : '') +
           (minutes > 0 || hours > 0 || days > 0 ? minutes + 'm ' : '') +
           seconds + 's';
}

function formatNumber(num) {
    num = num || 0;
    if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'm';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + 'k';
    } else {
        return num.toFixed(0);
    }
    return num.join('.');
}

function formatString(string) {
    var args = arguments;
    var pos = 1;
    return string.replace(/%(.)/g, function(_, chr) {
        if (chr === 's') return args[pos++];
        if (chr === 'd') return Number(args[pos++]);
        return chr;
    });
}

command.prototype.image = function(project, callback) {
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

command.prototype.tilelive = function (project, callback) {
    var cmd = this;
    var tilelive = require('tilelive');

    // Attempt to support additional tilelive protocols.
    try { require('tilelive-' + this.opts.format).registerProtocols(tilelive); }
    catch(err) {}
    try { require(this.opts.format).registerProtocols(tilelive); }
    catch(err) {}

    require('tilelive-mapnik').registerProtocols(tilelive);

    var opts = this.opts;

    // Try to load a job file if one was given and it exists.
    if (opts.job) {
        opts.job = path.resolve(opts.job);
        try {
            var job = fs.readFileSync(opts.job, 'utf8');
        } catch(err) {
            if (err.code !== 'EBADF') throw err;
        }
    } else {
        // Generate a job file based on the output filename.
        var slug = path.basename(opts.filepath, path.extname(opts.filepath));
        opts.job = path.join(path.dirname(opts.filepath), slug + '.export');
    }

    if (job) {
        job = JSON.parse(job);
        if (!cmd.opts.quiet) console.warn('Continuing job ' + opts.job);
        var scheme = tilelive.Scheme.unserialize(job.scheme);
        var task = new tilelive.CopyTask(job.from, job.to, scheme, opts.job);
    } else {
        if (!cmd.opts.quiet) console.warn('Creating new job ' + opts.job);

        var from = {
            protocol: 'mapnik:',
            slashes: true,
            xml: project.xml,
            mml: project.mml,
            pathname: path.join(opts.files, 'project', project.id, project.id + '.xml'),
            query: { bufferSize: opts.bufferSize, metatile: opts.metatile }
        };

        var to = {
            protocol: opts.format + ':',
            pathname: opts.filepath,
            query: { batch: 100 }
        };

        var scheme = tilelive.Scheme.create(opts.scheme, {
            list: opts.list,
            bbox: project.mml.bounds,
            minzoom: project.mml.minzoom,
            maxzoom: project.mml.maxzoom,
            metatile: opts.metatile,
            concurrency: Math.floor(
                Math.pow(cmd.opts.metatile, 2) *    // # of tiles in each metatile
                require('os').cpus().length *       // expect one metatile to occupy each core
                4 / cmd.opts.concurrency            // overcommit x4 throttle by export concurrency
            )
        });
        var task = new tilelive.CopyTask(from, to, scheme, opts.job);
    }


    var errorfile = path.join(path.dirname(opts.job), path.basename(opts.job) + '-failed');
    if (!cmd.opts.quiet) console.warn('Writing errors to ' + errorfile);

    fs.open(errorfile, 'a', function(err, fd) {
        if (err) throw err;

        task.on('error', function(err, tile) {
            console.warn('\r\033[K' + tile.toString() + ': ' + err.message);
            fs.write(fd, JSON.stringify(tile) + '\n');
            report(task.stats.snapshot());
        });

        task.on('progress', report);

        task.on('finished', function() {
            if (!cmd.opts.quiet) console.warn('\nfinished');
            callback();
        });

        task.start(function(err) {
            if (err) throw err;
            task.sink.putInfo(project.mml, function(err) {
                if (err) throw err;
            });
        });
    });

    function report(stats) {
        var progress = stats.processed / stats.total;
        var remaining = cmd.remaining(progress, task.started);
        cmd.put({
            status: progress < 1 ? 'processing' : 'complete',
            progress: progress,
            remaining: remaining,
            updated: +new Date(),
            rate: stats.speed
        });

        if (!cmd.opts.quiet) {
            util.print(formatString('\r\033[K[%s] %s%% %s/%s @ %s/s | %s left | ✓ %s ■ %s □ %s fail %s',
                formatDuration(stats.date - task.started),
                ((progress || 0) * 100).toFixed(4),
                formatNumber(stats.processed),
                formatNumber(stats.total),
                formatNumber(stats.speed),
                formatDuration(remaining),
                formatNumber(stats.unique),
                formatNumber(stats.duplicate),
                formatNumber(stats.skipped),
                formatNumber(stats.failed)
            ));
        }
    }
};

command.prototype.upload = function (callback) {
    if (!this.opts.syncAccount || !this.opts.syncAccessToken)
        return callback(new Error('MapBox Hosting account must be authorized.'));

    var cmd = this;
    var key;
    var bucket;
    var mapURL = _('<%=base%>/<%=account%>/map/<%=handle%>')
        .template({
            base: this.opts.syncURL,
            account: this.opts.syncAccount,
            handle: this.opts.project
        });
    var modelURL = _('<%=base%>/api/Map/<%=account%>.<%=handle%>?access_token=<%=token%>')
        .template({
            base: this.opts.syncURL,
            account: this.opts.syncAccount,
            handle: this.opts.project,
            token: this.opts.syncAccessToken
        });
    var hash = crypto.createHash('md5')
        .update(+new Date + '')
        .digest('hex')
        .substring(0, 6);
    var policyEndpoint = url.format(_(url.parse(this.opts.syncAPI)).extend({
            pathname: '/v2/'+ hash + '/upload.json'
        }));

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
        request.get(modelURL, this);
    }, function(err, res, body) {
        if (err) throw err;

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
        callback(null, { url:mapURL });
    });
};

command.prototype.sync = function (project, callback) {
    var cmd = this;
    var modifier = 0;
    var resp;
    cmd.putFilter = function(data) {
        if (!data.progress) return data;
        data.progress = (data.progress*0.5) + modifier;
        return data;
    };
    cmd.opts.filepath = _(cmd.opts.files + '/cache/tm-sync-<%=id%>-<%=time%>.mbtiles').template({
        id: project.id,
        time: + new Date
    });
    cmd.opts.format = 'mbtiles';
    Step(function() {
        cmd.tilelive(project, this);
    }, function(err) {
        if (err) throw err;
        modifier = 0.5;
        cmd.upload(this);
    }, function(err, data) {
        if (err) throw err;
        resp = data;
        fs.unlink(cmd.opts.filepath, this);
    }, function(err) {
        cmd.complete(err, resp);
    });
};

