var npm = require('npm');
var path = require('path');
var Step = require('step');
var semver = require('semver');

models.Plugin.prototype.sync = function(method, model, success, error) {
    // Deletion is a special case. We don't need to validate
    // version, package info.
    if (method === 'delete') return Step(function() {
        npm.load({}, this);
    }, function(err) {
        if (err) throw err;
        npm.localPrefix = path.join(process.env.HOME, '.tilemill');
        npm.commands.uninstall([model.id], this);
    }, function(err) {
        if (err) return error(err);
        // Remove from abilities.
        delete Bones.plugin.abilities.plugins[model.id];
        // No way to unload code...
        return success({});
    });

    var version = Bones.plugin.abilities.tilemill.version;
    Step(function() {
        npm.load({}, this);
    }, function(err) {
        if (err) throw err;
        npm.localPrefix = path.join(process.env.HOME, '.tilemill');
        npm.commands.view([model.id], true, this);
    }, function(err, resp) {
        if (err) return error(err);
        var resp = (function(resp) {
            for (var key in resp) return resp[key];
        })(resp);

        // Check engine key.
        if (!resp.engines || !resp.engines.tilemill)
            return error(new Error('Package is not a TileMill plugin.'));
        resp.id = resp.name;

        switch (method) {
        case 'read':
            return success(resp);
            break;
        case 'create':
        case 'update':
            if (!semver.satisfies(version, resp.engines.tilemill))
                return error(new Error('Package is not compatible with TileMill ' + version + '.'));
            npm.commands.install([model.id], function(err) {
                if (err) return error(err);
                Bones.plugin.abilities.plugins[model.id] = resp;
                Bones.load(path.join(process.env.HOME, '.tilemill', model.id));
                return success(resp);
            });
            break;
        }
    });
};
