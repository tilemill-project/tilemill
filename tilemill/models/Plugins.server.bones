var npm = require('npm');
var path = require('path');
var Step = require('step');
var semver = require('semver');

models.Plugins.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error(new Error('Unsupported method.'));

    Step(function() {
        var opts = {};
        if (Bones.plugin.config.httpProxy) opts.proxy = Bones.plugin.config.httpProxy;
        npm.load(opts, this);
    }, function(err) {
        if (err) throw err;

        npm.localPrefix = path.join(process.env.HOME, '.tilemill');
        // @TODO determine a reasonable "staleness" value.
        // Currently set to 0.
        npm.commands.search(['tilemill'], true, 0, this);
    }, function(err, resp) {
        if (err) throw err;

        var group = this.group();
        _(resp).each(function(data) {
            npm.commands.view([data.name + '@*'], true, group());
        });
    }, function(err, resp) {
        if (err) return error(err);

        // - Copy 'name' to 'id' for Backbone.
        // - Filters packages to ones with tilemill as an engine
        success(resp
            .map(function(p) {
                var keys = _.keys(p).reverse();
                for (var i in keys) {
                    if (p[keys[i]].engines && p[keys[i]].engines.tilemill &&
                        semver.satisfies(Bones.plugin.abilities.tilemill.version, p[keys[i]].engines.tilemill))
                        return p[keys[i]]
                }})
            .filter(function(p) { return p})
            .map(function(p) { p.id = p.name; return p; }));
    });
};
