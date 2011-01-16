var _ = require('underscore')._,
    Backbone = require('./modules/backbone/backbone.js'),
    settings = require('./settings'),
    rmrf = require('./rm-rf'),
    fs = require('fs'),
    events = require('events'),
    Step = require('step'),
    path = require('path');

Backbone.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        if (model.id) {
            find(model, success, error);
        } else {
            findAll(success, error);
        }
        break;
    case 'create':
        create(model, success, error);
        break;
    case 'update':
        update(model, success, error);
        break;
    case 'delete':
        destroy(model, success, error);
        break;
    }
};

function find(model, success, error) {
    var projectPath = path.join(settings.files, 'project', model.id);
    fs.readFile(path.join(projectPath, model.id + '.mml'), 'utf-8',
    function(err, data) {
        if (err || !data) {
            return error(new Error('Error reading project file.'));
        }
        var object = JSON.parse(data);
        if (data && object) {
            _.extend(model, object);
        }
        if (model.Stylesheet && model.Stylesheet.length > 0) {
            var queue = new events.EventEmitter;
            var queueLength = model.Stylesheet.length;
            _.each(model.Stylesheet, function(filename, key) {
                fs.readFile(path.join(projectPath, filename),
                'utf-8',
                function(err, data) {
                    model.Stylesheet[key] = {
                        id: filename,
                        data: data
                    };
                    queueLength--;
                    if (queueLength === 0) {
                        queue.emit('complete');
                    }
                });
            });
            queue.on('complete', function() {
                return success(model);
            });
        }
        else {
            return success(model);
        }
    });
};

function findAll(success, error) {
    var loaded = [];
    var queue = new events.EventEmitter;
    var basepath = path.join(settings.files, 'project');
    path.exists(basepath, function(exists) {
        if (!exists) fs.mkdirSync(basepath, 0777);
        fs.readdir(basepath, function(err, files) {
            if (err) {
                return error(new Error('Error reading projects directory.'));
            }
            else if (files.length === 0) {
                next();
            }
            var queueLength = files.length;
            for (var i = 0; i < files.length; i++) {
                find(
                    {id: files[i]},
                    function(model) {
                        loaded.push(model);
                        queueLength--;
                        if (queueLength === 0) {
                            queue.emit('complete');
                        }
                    },
                    function(err) {
                        queueLength--;
                        if (queueLength === 0) {
                            queue.emit('complete');
                        }
                    }
                );
            }
        });
    });
    queue.on('complete', function() {
        success(loaded);
    });
};

function create(model, success, error) {
    // @TODO assign a model id if not present.
    save(model, success, error);
};

function update(model, success, error) {
    save(model, success, error);
};

function destroy(model, success, error) {
    var projectPath = path.join(settings.files, 'project', model.id);
    rmrf(projectPath, function() {
        return success(model);
    });
};

function save(model, success, error) {
    var projectPath = path.join(settings.files, 'project', model.id);

    /*
    @TODO: this is validation logic.
    if (!this.Stylesheet) {
        callback(new Error('No stylesheets found'));
        return
    } else {
        _.reduce(_.pluck(this.Stylesheet, 'id'), function(memo, val) {
            if (memo[val]) {
                callback(new Error('Stylesheet ids must be unique.'));
                return;
            } else {
                memo[val] = true;
                return memo;
            }
        }, {});
    }
    */

    rmrf(projectPath, function() {
        fs.mkdir(projectPath, 0777, function() {
            var data = _.extend({}, model.toJSON());
            var files = [];
            if (data.id) {
                delete data.id;
            }
            if (data.Stylesheet) {
                // Use _.extend() to create a clone of the Stylesheets object.
                // We want to retain the original data for returning the model
                // on success.
                data.Stylesheet = _.extend({}, data.Stylesheet);
                _.each(data.Stylesheet, function(stylesheet, key) {
                    if (stylesheet.id) {
                        files.push({
                            filename: stylesheet.id,
                            data: stylesheet.data
                        });
                        data.Stylesheet[key] = stylesheet.id;
                    }
                });
            }
            files.push({
                filename: model.id + '.mml',
                data: JSON.stringify(data)
            });

            var queue = new events.EventEmitter;
            var queueLength = files.length;
            for (var i = 0; i < files.length; i++) {
                // @TODO work through stylesheet queue and save each one individually.
                fs.writeFile(path.join(projectPath, files[i].filename),
                    files[i].data,
                    function(err) {
                    queueLength--;
                    if (queueLength === 0) {
                        queue.emit('complete');
                    }
                });
            }
            queue.on('complete', function() {
                success(model);
            });
        });
    });
}

module.exports = Backbone;

