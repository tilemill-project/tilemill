var path = require('path');
var fs = require('fs');

models.Page.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error('Method not supported.');
    var filepath = path.resolve(path.join(__dirname, '..', 'pages', model.id));
    fs.readFile(filepath, 'utf8', function(err, data) {
        if (err) return error(err);
        return success({id: model.id, data: $('.md', data).text()});
    });
};
