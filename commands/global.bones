var path = require('path');

Bones.Command.options['files'] = {
    'title': 'files=[path]',
    'description': 'Path to files directory.',
    'default': path.join(process.env.HOME, 'Documents', 'MapBox')
};

Bones.Command.options['bufferSize'] = {
    'title': 'bufferSize=[number]',
    'description': 'Mapnik render buffer size.',
    'default': 256
};

