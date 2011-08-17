var fs = require('fs');
var path = require('path');
var defaults = JSON.parse(fs.readFileSync(
    path.resolve(__dirname + '/../lib/config.defaults.json'),
    'utf8'
));

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

