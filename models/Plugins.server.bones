var npm = require('npm');
var path = require('path');
var Step = require('step');

models.Plugins.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error(new Error('Unsupported method.'));

    Step(function() {
        npm.load({}, this);
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
            npm.commands.view([data.name], true, group());
        });
    }, function(err, resp) {
        if (err) return error(err);

        // - Copy 'name' to 'id' for Backbone.
        // - Filters packages to ones with tilemill as an engine
        success(resp
            .map(function(p) { for (var key in p) return p[key] })
            .filter(function(p) { return p.engines && p.engines.tilemill })
            .map(function(p) { p.id = p.name; return p; }));
    });
};
