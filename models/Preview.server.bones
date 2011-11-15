var path = require('path');
var tilelive = require('tilelive');
var settings = Bones.plugin.config;

models.Preview.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error(new Error('Method not supported.'));
    var filepath = path.join(settings.files, 'export', model.id);
    tilelive.load('mbtiles://' + filepath, function(err, source) {
        if (err) return error(err);
        source.getInfo(function(err, info) {
            if (err) return error(err);
            info.tiles = ['/tiles/' + model.id + '/{z}/{x}/{y}.png'];
            success(_(info).extend({id: model.id }));
        });
    });
};

