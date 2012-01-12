var fs = require('fs');
var path = require('path');
var defaults = models.Config.defaults;

Bones.Command.options['files'] = {
    'title': 'files=[path]',
    'description': 'Path to files directory.',
    'default': defaults.files.replace('~', process.env.HOME)
};

Bones.Command.options['bufferSize'] = {
    'title': 'bufferSize=[number]',
    'description': 'Mapnik render buffer size.',
    'default': defaults.bufferSize
};

Bones.Command.options['syncURL'] = {
    'title': 'syncURL=[URL]',
    'description': 'MapBox sync URL.',
    'default': defaults.syncURL || ''
};

Bones.Command.options['syncAccount'] = {
    'title': 'syncAccount=[account]',
    'description': 'MapBox account name.',
    'default': defaults.syncAccount || ''
};

Bones.Command.options['syncAccessToken'] = {
    'title': 'syncAccessToken=[token]',
    'description': 'MapBox access token.',
    'default': defaults.syncAccessToken || ''
};

Bones.Command.options['updates'] = {
    'title': 'updates=1|0',
    'description': 'Automatically check for TileMill updates.',
    'default': true
};

Bones.Command.options['updatesTime'] = { 'default': 0 };
Bones.Command.options['updatesVersion'] = { 'default': '0.0.1' };

