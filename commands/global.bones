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

