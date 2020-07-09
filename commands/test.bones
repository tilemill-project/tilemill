command = commands['core'].extend();

command.description = 'test server process';

command.prototype.initialize = function(plugin, callback) {
    Bones.plugin.command = this;
    var remaining = 2;
    this.servers = {};
    this.servers['Core'] = new plugin.servers['Core'](plugin);
    this.servers['Tile'] = new plugin.servers['Tile'](plugin);
    _(this.servers).each(function(server) {
        server.start(function() {
            remaining--;
            console.warn('Started %s.', Bones.utils.colorize(server, 'green'));
            server.emit('start');
            if (!remaining) callback && callback();
        }.bind(this));
    }.bind(this));
};
