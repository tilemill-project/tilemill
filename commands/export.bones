var fs = require('fs');
var url = require('url');
var path = require('path');
var request = require('request');
var crypto = require('crypto');
var util = require('util');
var Step = require('step');
var http = require('http');
var chrono = require('chrono');
var carto = require('carto');
var crashutil = require('../lib/crashutil');
var _ = require('underscore');
var sm = new (require('sphericalmercator'))();
var os = require('os');
var upload = require('mapbox-upload');
// node v6 -> v8 compatibility
var existsSync = require('fs').existsSync || require('path').existsSync;

var mapnik = require('mapnik');
if (mapnik.register_default_fonts) mapnik.register_default_fonts();
if (mapnik.register_system_fonts) mapnik.register_system_fonts();
if (mapnik.register_default_input_plugins) mapnik.register_default_input_plugins();


command = Bones.Command.extend();

command.description = 'export project';
command.usage = '<project> <export>';

command.options['format'] = {
    'title': 'format=[format]',
    'description': 'Export format (png|jpeg|webp|tiff|pdf|svg|mbtiles|upload|sync).'
};

command.options['bbox'] = {
    'title': 'bbox=[xmin,ymin,xmax,ymax]',
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

command.options['static_zoom'] = {
    'title': 'static_zoom=[zoom]',
    'description': 'Image: explicity set the zoom level of the static map.'
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
    'description': 'Metatile size.'
};

command.options['scale'] = {
    'title': 'scale=[num]',
    'description': 'Scale factor (default is 1.0)'
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
    opts.project = plugin.argv._[1] && plugin.argv._[1].toString();
    var export_filename = plugin.argv._[2];
    if (!export_filename) return plugin.help();
    opts.filepath = path.resolve(export_filename.replace(/^~/,process.env.HOME));
    callback = callback || function() {};
    this.opts = opts;
    var cmd = this;

    // Note: this is reset again below, to reflect any changes in the output name
    process.title = 'tm-' + path.basename(opts.filepath);

    // Write export-specific crash log
    process.on('uncaughtException', function(err) {
        cmd.error(err, function() {
            // try/catch here to avoid recursion
            // https://github.com/mapbox/tilemill/issues/2072
            try {
                var crash_log = opts.filepath + '.crashlog';
                if (opts.log) {
                    console.warn('Export process died, log written to: ' + crash_log);
                    fs.writeFileSync(crash_log, err.stack || err.toString());
                } else {
                    console.warn('Export process died: ' + err.stack || err.toString());
                }
            } catch(e) {
                console.error('Export process died: ' + err.stack || err.toString())
            }
            // force exit here because cleanup in tilelive is not working leading to:
            // Error: SQLITE_IOERR: disk I/O error
            // https://github.com/mapbox/tilemill/issues/1360
            process.exit(0);
        });
    });

    process.on('SIGINT', function(code, signal) {
        console.warn('Exiting process [' + process.title + ']');
        if (code !== 0)
        {
            crashutil.display_crash_log(function(err,logname) {
                if (err) {
                    console.warn(err.stack || err.toString());
                }
                if (logname) {
                    console.warn("[tilemill] Please post this crash log: '" + logname + "' to https://github.com/mapbox/tilemill/issues");
                }
            });
        }
    });

    // Validation.
    if (!opts.project || !opts.filepath) return plugin.help();
    if (!existsSync(path.dirname(opts.filepath)))
        return this.error(new Error('Export path does not exist: ' + path.dirname(opts.filepath)));

    // Format.
    if (!opts.format) opts.format = path.extname(opts.filepath).split('.').pop();
    console.log('Exporting format: ' + opts.format);

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
    if (!_(opts.scale).isUndefined())
        opts.scale = +opts.scale;

    // convert static_map fixed_zoom to scale_denominator
    if (!_(opts.static_zoom).isUndefined()) {
        opts.scale_denominator = carto.tree.Zoom.ranges[opts.static_zoom];
    }

    // Rename the output filepath using a random hash if file already exists.
    if (existsSync(opts.filepath) &&
        _(['png','jpeg','jpg','wepb','tiff','tif','pdf','svg','mbtiles']).include(opts.format)) {
        var hash = crypto.createHash('md5')
            .update(+new Date + '')
            .digest('hex')
            .substring(0, 6);
        var ext = path.extname(opts.filepath);
        opts.filepath = opts.filepath.replace(ext, '_' + hash + ext);
        console.log('found previous export with same name, so renamed to: ' + path.basename(opts.filepath));

        // Update filename in TileMill.
        this.put({ filename: path.basename(opts.filepath), status: 'processing' });
    }

    // Set process title.
    process.title = 'tm-' + path.basename(opts.filepath);

    // Upload format does not require loaded project.
    if (opts.format === 'upload') return this[opts.format](this.complete);

    // Load project, localize and call export function.
    var model = new models.Project({id:opts.project});
    Step(function() {
        if (!cmd.opts.quiet) process.stderr.write('Loading project...');
        Bones.utils.fetch({model:model}, this);
    }, function(err) {
        if (err) return cmd.error(err, function() {
            process.stderr.write(err.stack || err.toString() + '\n');
            process.exit(1);
        });
        if (!cmd.opts.quiet) process.stderr.write(' done.\n');
        // Set the postgres connection pool size to 2 * # of cpus based on
        // assumption of pool size in tilelive-mapnik.
        model.get('Layer').each(function(l) {
            if (l.attributes.Datasource && l.attributes.Datasource.dbname) {
                var target_size = os.cpus().length * 2;
                if (l.attributes.Datasource.max_size === undefined ||
                    l.attributes.Datasource.max_size < target_size) {
                    l.attributes.Datasource.max_size = target_size;
                    console.log('setting PostGIS max_size='+target_size+' for ' + l.id);
                }
            }
        });
        if (!cmd.opts.quiet) process.stderr.write('Localizing project...');
        model.localize(model.toJSON(), this);
    }, function(err) {
        if (err) return cmd.error(err, function() {
            process.stderr.write(err.stack || err.toString() + '\n');
            process.exit(1);
        });

        if (!cmd.opts.quiet) process.stderr.write(' done.\n');
        model.mml = _(model.mml).extend({
            name: model.mml.name || model.id,
            version: model.mml.version || '1.0.0',
            minzoom: !_(opts.minzoom).isUndefined() ? opts.minzoom : model.get('minzoom'),
            maxzoom: !_(opts.maxzoom).isUndefined() ? opts.maxzoom : model.get('maxzoom'),
            bounds: !_(opts.bbox).isUndefined() ? opts.bbox : model.get('bounds'),
            scale: !_(opts.scale).isUndefined() ? opts.scale : model.get('scale'),
            metatile: !_(opts.metatile).isUndefined() ? opts.metatile : model.get('metatile')
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
        case 'jpeg':
        case 'jpg':
        case 'webp':
        case 'tiff':
        case 'tif':
        case 'svg':
        case 'pdf':
            console.log('Rendering single static map');
            cmd.static_map(model, cmd.complete);
            break;
        case 'upload':
            console.log('Uploading new export');
            cmd.upload(model, cmd.complete);
            break;
        case 'sync':
            console.log('Syncing export with existing upload');
            cmd.sync(model, cmd.complete);
            break;
        default:
            console.log('Rendering export');
            cmd.tilelive(model, cmd.complete);
            break;
        }
    });
};

command.prototype.complete = function(err, data) {
    console.log('Completing export process');
    if (err) {
        console.warn(err.stack || err.toString() + '\n');
        this.error(err, function() {
            process.exit(0);
        });
    } else {
        data = _(data||{}).defaults({
            status: 'complete',
            progress: 1,
            remaining: 0,
            updated: +new Date()
        });
        this.put(data, process.exit);
    }
};

command.prototype.error = function(err, callback) {
    this.put({
        status: 'error',
        error: _.escape(err.toString()),
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

    if (!this.opts.url) {
        return callback();
    }
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

command.prototype.static_map = function(project, callback) {
    try {
        var map = new mapnik.Map(this.opts.width, this.opts.height);
        map.fromStringSync(project.xml, {
            strict: false,
            base: path.join(this.opts.files, 'project', project.id) + '/'
        });
        map.extent = sm.convert(project.mml.bounds, '900913');
        map.renderFileSync(this.opts.filepath, {
            format: this.opts.format,
            scale: project.mml.scale,
            scale_denominator: this.opts.scale_denominator || 0.0
        });
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

    // Copy the bounds so that we can modify them if we need to split the export
    var bboxes = [ project.mml.bounds.slice(0) ];
    if (project.mml.bounds[2] < project.mml.bounds[0]) {
        bboxes.push(bboxes[0].slice(0));
        bboxes[0][2] = 180;
        bboxes[1][0] = -180;

        // If we don't set the bounds to the whole world tilestream will not be able to display the files
        // because the center of the bounds will be outside the bounds.
        project.mml.bounds = [ -180, project.mml.bounds[1], 180, project.mml.bounds[3] ];
    }

    function exportTiles(bboxIndex) {
        if (bboxIndex >= bboxes.length) {
            return callback();
        }
        var opts = $.extend({}, cmd.opts);

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
            bboxIndex = job.from.bboxIndex;
            // If we don't reset the filepath here the next bbox exported will be exported using a filepath with a hash
            // instead of into the same file.
            cmd.opts.filepath = job.to.pathname;
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
                query: {
                    metatile: project.mml.metatile,
                    scale: project.mml.scale
                },
                // Add a hash with the bounding box to prevent tilelive pulling data from the cache
                // that has the previously exported bounds.
                hash: "bbox=" + bboxes[bboxIndex].join(','),
                bboxIndex: bboxIndex
            };

            var to = {
                protocol: opts.format + ':',
                pathname: opts.filepath,
                query: { batch: 100 }
            };

            var scheme = tilelive.Scheme.create(opts.scheme, {
                list: opts.list,
                bbox: bboxes[bboxIndex],
                minzoom: project.mml.minzoom,
                maxzoom: project.mml.maxzoom,
                metatile: project.mml.metatile,
                concurrency: Math.floor(
                    Math.pow(project.mml.metatile, 2) * // # of tiles in each metatile
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
                cmd.opts.job = false;
                exportTiles(bboxIndex + 1);
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
                status: 'processing',
                progress: progress,
                remaining: remaining,
                updated: +new Date(),
                rate: stats.speed
            });

            if (!cmd.opts.quiet) {
                util.print(formatString('\r\033[K[%s] Part(%s/%s) %s%% %s/%s @ %s/s | %s left | ✓ %s ■ %s □ %s fail %s',
                    formatDuration(stats.date - task.started),
                    bboxIndex + 1,
                    bboxes.length,
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
    }

    exportTiles(0);
};

command.prototype.upload = function (callback) {
    if (!this.opts.syncAccount || !this.opts.syncAccessToken)
        return callback(new Error('MapBox Hosting account must be authorized.'));

    var cmd = this;
    var proxy = Bones.plugin.config.httpProxy || process.env.HTTP_PROXY;
    var started = Date.now();
    var updated = Date.now();

    var progress = upload({
        account: cmd.opts.syncAccount,
        mapid: [this.opts.syncAccount, this.opts.project].join('.'),
        accesstoken: this.opts.syncAccessToken,
        stream: fs.createReadStream(cmd.opts.filepath),
        length: fs.statSync(cmd.opts.filepath).size,
        proxy: proxy
    }).on('progress', function(progress) {
        if (Date.now() < updated + 5000) return;
        updated = Date.now();
        cmd.put({
            progress: progress.percentage / 100,
            status: 'processing',
            remaining: cmd.remaining(progress.percentage / 100, started),
            updated: updated
        });
    }).on('error', function(err) {
        callback(err);
    }).on('finished', function(body) {
        callback(null, { url: 'https://www.mapbox.com/data/' });
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

