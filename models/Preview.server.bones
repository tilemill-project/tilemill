var path = require('path');
var tilelive = require('tilelive');
var settings = Bones.plugin.config;

models.Preview.prototype.sync = function(method, model, success, error) {
    if (method !== 'read') return error(new Error('Method not supported.'));
    var filepath = path.join(settings.files, 'export', model.id);
    var uri = {protocol:'mbtiles:',pathname:filepath};
    tilelive.load(uri, function(err, source) {
        if (err) return error(err);
        source.getInfo(function(err, info) {
            if (err) return error(err);
            info.tiles = ['http://' + settings.tileUrl + '/tile/' + model.id + '/{z}/{x}/{y}.png?' + (+new Date)];
            success(_(info).extend({id: model.id }));
        });
    });
};

