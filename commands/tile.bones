var path = require('path');
var defaults = models.Config.defaults;

command = Bones.Command.extend();

command.description = 'start tile server';

command.options['tilePort'] = {
    'title': 'tilePort=[port]',
    'description': 'Tile server port.',
    'default': defaults.tilePort
};

command.prototype.bootstrap = function(plugin, callback) {
    var settings = Bones.plugin.config;
    settings.files = path.resolve(settings.files);
    process.title = 'tilemill-tile';
    callback();
};

command.prototype.initialize = function(plugin, callback) {
    this.servers = {};
    this.servers['Tile'] = new plugin.servers['Tile'](plugin);
    this.servers['Tile'].start(function() {
        console.warn('Started %s.', Bones.utils.colorize(this, 'green'));
        this.emit('start');
        callback && callback();
    });
};
