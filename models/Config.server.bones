var fs = require('fs');
var path = require('path');
var Step = require('step');
var paths = {
    user: path.join(process.env.HOME, '.tilemill/config.json'),
    vendor: path.resolve(__dirname + '/../lib/config.defaults.json')
};

models.Config.defaults = JSON.parse(fs.readFileSync(paths.vendor, 'utf8'));
models.Config.prototype.sync = function(method, model, success, error) {
    if (method === 'delete') return error(new Error('Method not supported.'));

    switch (method) {
    case 'defaults':
        var data = _(defaults).clone();
        if (data.files.indexOf(process.env.HOME) === 0)
            data.files = data.files.replace(process.env.HOME, '~');
        return success(data);
        break;
    case 'read':
        var data = _(Bones.plugin.config).clone();
        if (data.files.indexOf(process.env.HOME) === 0)
            data.files = data.files.replace(process.env.HOME, '~');
        return success(data);
        break;
    case 'create':
    case 'update':
        // Filter out keys that may not be written.
        var allowedKeys = ['bufferSize', 'files', 'syncAccount', 'syncAccessToken'];
        var data = _(model.toJSON()).reduce(function(memo, val, key) {
            if (key === 'files') val = val.replace('~', process.env.HOME);
            if (_(allowedKeys).include(key)) memo[key] = val;
            return memo;
        }, {});

        Step(function() {
            fs.readFile(paths.user, 'utf8', this);
        // Write changes to user config file.
        }, function(err, current) {
            if (err && err.code !== 'ENOENT') throw err;

            // Catch & blow away invalid user JSON.
            try { current = JSON.parse(current); }
            catch (e) { current = {}; }

            data = _(current).extend(data);
            fs.writeFile(paths.user, JSON.stringify(data, null, 2), this);
        // May contain sensitive info. Set secure permissions.
        }, function(err) {
            if (err) throw err;
            fs.chmod(paths.user, 0600, this);
        // Update runtime config in memory.
        }, function(err) {
            if (err) return error(err);
            Bones.plugin.config = _(Bones.plugin.config).extend(data);
            return success({});
        });
        break;
    case 'delete':
        return error(new Error('Method not supported.'));
        break;
    }
};

