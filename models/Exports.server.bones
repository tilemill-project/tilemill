var Step = require('step'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    settings = Bones.plugin.config;

var start = function(model, data, callback) {
    if (data.pid && _(['waiting', 'processing']).include(data.status)) {
        var pid = data.pid
        exec('ps -p ' + pid + ' | grep ' + pid, function(err, stdout) {
            if (err) {
                model.set({status: 'error', error: 'Export process died.'});
                Backbone.sync('update', model, callback, callback);
            } else {
                callback();
            }
        });
    } else if (data.status === 'waiting') {
        var args = [];
        // tilemill index.js
        args.push(path.resolve(path.join(__dirname + '/../index.js')));
        // export command
        args.push('export');
        // datasource
        args.push(path.join(
            settings.files,
            'project',
            data.project,
            data.project + '.mml'
        ));
        // filepath
        args.push(path.join(
            settings['export'],
            data.filename
        ));
        // url
        // @TODO: need proper host info.
        args.push('--url=' + 'http://localhost:'+settings.port+'/api/Export/'+data.id);

        if (data.bbox) args.push('--bbox=' + data.bbox.join(','));
        if (data.width) args.push('--width=' + data.width);
        if (data.height) args.push('--height=' + data.height);
        if (data.minzoom) args.push('--minzoom=' + data.minzoom);
        if (data.maxzoom) args.push('--maxzoom=' + data.maxzoom);

        var child = spawn(process.execPath, args);
        model.set({pid: child.pid});
        Backbone.sync('update', model, callback, callback);
    } else if (data.status === 'processing') {
        model.set({status: 'error', error: 'Export process died.'});
        Backbone.sync('update', model, callback, callback);
    } else {
        callback();
    }
};

models.Export.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'delete':
        Step(function() {
            Backbone.sync('read', model, this, this);
        },
        function(data) {
            if (data && data.pid) process.kill(pid, 'SIGUSR1');
            if (data && data.filename) {
                var filepath = path.join(settings['export'], data.filename);
                path.exists(filepath, function(exists) {
                    exists && fs.unlink(filepath, this) || this();
                }.bind(this));
            } else {
                this();
            }
        },
        function() {
            Backbone.sync(method, model, success, error);
        });
        break;
    case 'read':
        Backbone.sync(method, model, function(data) {
            start(model, model.toJSON(), function() {
                success(data);
            });
        }, error);
        break;
    case 'create':
        Backbone.sync(method, model, function(data) {
            start(model, model.toJSON(), function() {
                success(data);
            });
        }, error);
        break;
    case 'update':
        Backbone.sync(method, model, success, error);
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
