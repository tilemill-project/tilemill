var Step = require('step'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    settings = Bones.plugin.config;

// @TODO: need a queue system. Difficult to manage atm because process
// completion is now determined outside this process.
// See http://en.wikipedia.org/wiki/SIGCHLD ... may be useful for determining
// when a child process has died and can be removed from the pool.
var start = function(model, data, callback) {
    if (data.status === 'waiting') {
        var args = [];
        // tilemill index.js
        args.push(path.resolve(path.join(__dirname + '/../index.js')));
        // export command
        args.push('export');
        // datasource
        args.push(data.project);
        // filepath
        args.push(path.join(settings.files, 'export', data.filename));
        // url, @TODO: need proper host info.
        args.push('--url=' + 'http://localhost:'+settings.port+'/api/Export/'+data.id);

        if (data.bbox) args.push('--bbox=' + data.bbox.join(','));
        if (data.width) args.push('--width=' + data.width);
        if (data.height) args.push('--height=' + data.height);
        if (data.minzoom) args.push('--minzoom=' + data.minzoom);
        if (data.maxzoom) args.push('--maxzoom=' + data.maxzoom);

        var child = spawn(process.execPath, args);
        model.set({pid:child.pid, status:'processing'});
        Backbone.sync('update', model, callback, callback);
    } else if (data.status === 'processing') {
        var pid = data.pid || 0;
        exec('ps -p ' + pid + ' | grep ' + pid, function(err, stdout) {
            if (!err) return callback();
            model.set({status: 'error', error: 'Export process died.'});
            Backbone.sync('update', model, callback, callback);
        });
    } else {
        callback();
    }
};

models.Export.prototype.sync = function(method, model, success, error) {
    switch (method) {
    // Export child processes are managed from the parent:
    // 1. when an export model is first created a process is started.
    // 2. when reading models the process health is checked.
    case 'read':
    case 'create':
        Backbone.sync(method, model, function(data) {
            start(model, model.toJSON(), function() {
                success(data);
            });
        }, error);
        break;
    // Updates occur via the child process.
    case 'update':
        Backbone.sync(method, model, success, error);
        break;
    // Deletion kills the child process and removes the export file if it
    // exists. Note that SIGUSR1 is used instead of SIGINT for two reasons:
    // 1. The child process does not exit directly on SIGINT to prevent it
    //    from going down if the parent goes down.
    // 2. If the model `pid` is stale and somehow the `pid` is now occupied
    //    by another process SIGUSR1 likely won't kill the process.
    case 'delete':
        Step(function() {
            Backbone.sync('read', model, this, this);
        },
        function(data) {
            if (data && data.pid) {
                // Try/catch as process may not exist.
                try { process.kill(data.pid, 'SIGUSR1'); }
                catch(err) {}
            }
            if (data && data.filename) {
                var filepath = path.join(settings['export'], data.filename);
                path.exists(filepath, function(exists) {
                    if (exists) return fs.unlink(filepath, this);
                    this();
                }.bind(this));
            } else {
                this();
            }
        },
        function(err) {
            Backbone.sync(method, model, success, error);
        });
        break;
    }
};

models.Exports.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return success({});
    Backbone.sync(method, model, function(data) {
        Step(function() {
            var group = this.group();
            _(data).each(function(m) {
                var model = new models.Export(m);
                start(model, model.toJSON(), group());
            });
        }, function() {
            success(data);
        });
    }, error);
};
