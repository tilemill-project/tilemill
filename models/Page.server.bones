var path = require('path');
var fs = require('fs');

models.Page.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error('Method not supported.');
    var filepath = path.resolve(path.join(__dirname, '..', '_posts', 'docs', 'reference', model.id));
    fs.readFile(filepath, 'utf8', function(err, data) {
        if (err) return error(err);
        data = data.substring(data.indexOf('---', 3) + 3);
        data = data.replace(/{{site.baseurl}}\/assets/g, '/assets/tilemill');
        return success({id: model.id, data: data});
    });
};
