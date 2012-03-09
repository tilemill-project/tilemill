var Step = require('step'),
    Queue = require('../lib/queue'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    settings = Bones.plugin.config,
    pids = {};

var queue = new Queue(start, 1);
function start(id, callback) {
    var model = new models.Export({id:id});
    Step(function() {
        Backbone.sync('read', model,
            function(data) { this(null, data) }.bind(this),
            function(err) { this(err) }.bind(this))
    }, function(err, data) {
        if (err || data.status !== 'waiting') return callback();

        var args = [];
        // tilemill index.js
        args.push(path.resolve(path.join(__dirname, '../index.js')));
        // export command
        args.push('export');
        // datasource
        args.push(data.project);
        // filepath
        args.push(path.join(settings.files, 'export', data.filename));
        // format, don't try to guess extension based on filepath
        args.push('--format=' + data.format);
        // url
        args.push('--url=http://' + settings.coreUrl + '/api/Export/'+data.id);
        // Log crashes to output directory.
        args.push('--log=1');
        // Don't output progress information.
        args.push('--quiet');

        if (data.bbox) args.push('--bbox=' + data.bbox.join(','));
        if (data.width) args.push('--width=' + data.width);
        if (data.height) args.push('--height=' + data.height);
        if (!_(data.minzoom).isUndefined()) args.push('--minzoom=' + data.minzoom);
        if (!_(data.maxzoom).isUndefined()) args.push('--maxzoom=' + data.maxzoom);

        var child = spawn(process.execPath, args, {
            env: _(process.env).extend({
                tilemillConfig:JSON.stringify(settings)
            }),
            cwd: undefined,
            setsid: false
        });

        function forwardOutput(type, output) {
            var prefix = '[' + data.filename + '] ' + type + ': ';
            if (output[output.length - 1] === '\n') {
                output = output.substring(0, output.length - 1);
            }
            console.warn(prefix + output.split('\n').join('\n' + prefix));
        }

        child.stdout.setEncoding('utf8');
        child.stdout.on('data', forwardOutput.bind(global, 'stdout'));
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', forwardOutput.bind(global, 'stderr'));

        var pid = child.pid;
        pids[pid] = true;

        child.on('exit', function(code) {
            delete pids[pid];
            callback();
        });
        (new models.Export(data)).save({
            pid:pid,
            created:Date.now(),
            status:'processing'
        });
    });
};

// Export child processes are managed from the parent:
// 1. when an export model with status 'waiting' is created or read
//    it is queued for export.
// 2. when reading models the process health is checked. if the pid
//    is not found, the model's status should be updated.
function check(data) {
    if (data.status === 'processing' && data.pid && !pids[data.pid])
        return { status: 'error', error: 'Export process died' };
    if (data.status === 'waiting' && !_(queue.queue).include(data.id))
        queue.add(data.id);
};

models.Export.prototype.sync = function(method, model, success, error) {
    queue.concurrency = settings.concurrency || 1;

    switch (method) {
    case 'read':
    case 'create':
    case 'update':
        if (!model.id) throw new Error('Model ID is required.');
        Backbone.sync(method, model, function(data) {
            var attr = check(model.toJSON());
            if (!attr) return success(data);

            // If attributes are set we must further update this model
            // to reflect its process status (it's dead, basically).
            model.set(attr);
            Backbone.sync('update', model, function() {
                success(_(data).extend(attr));
            }, error);
        }, error);
        break;
    // Deletion kills the child process and removes the export file.
    case 'delete':
        Step(function() {
            Backbone.sync('read', model, this, this);
        }, function(data) {
            // Try/catch as process may not exist.
            if (data && data.pid && pids[data.pid]) {
                delete pids[data.pid];
                // try { process.kill(data.pid, 'SIGUSR1'); }
                try { process.kill(data.pid, 'SIGINT'); }
                catch(err) {}
            }
            if (data && data.filename && data.format !== 'upload') {
                fs.unlink(path.join(settings.files, 'export', data.filename), this);
            } else {
                this();
            }
        }, function(err) {
            if (err && err.code !== 'ENOENT') return error(err);
            Backbone.sync(method, model, success, error);
        });
        break;
    }
};

models.Exports.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return success({});
    Step(function() {
        Backbone.sync(method, model, this, error);
    }, function(data) {
        if (!data || !data.length) return this(null, []);
        Bones.utils.fetch(data.reduce(function(memo, d) {
            memo[d.id] = new models.Export(d);
            return memo;
        }, {}), this);
    }, function(err, models) {
        if (err) return error(err);
        success(_(models).map(function(m) { return m.toJSON() }));
    });
};
