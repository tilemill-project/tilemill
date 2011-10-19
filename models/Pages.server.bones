var path = require('path');
var fs = require('fs');

models.Pages.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error('Method not supported.');
    var filepath = path.resolve(path.join(__dirname, '..', '_posts', 'docs', 'manual'));
    fs.readdir(filepath, function(err, data) {
        if (err) return error(err);
        var models = _(data).map(function(id) {
            var title = id.match(/[\d]{4}-[\d]{2}-[\d]{2}-([\w-]+)/)[1].
                            replace(/-/g, ' ').
                            replace(/mapbox/, 'MapBox');
            return {
                id: id,
                title: title.charAt(0).toUpperCase() + title.slice(1)
            };
        });
        return success(models);
    });
};
