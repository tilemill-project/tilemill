var path = require('path');

Bones.Command.options['files'] = {
    'title': 'files=[path]',
    'description': 'Path to files directory.',
    'default': path.join(process.env.HOME, 'Documents', 'TileMill')
};

