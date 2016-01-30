var fs = require('fs');
var path = require('path');
var defaults = models.Config.defaults;

Bones.Command.options['files'] = {
    'title': 'files=[path]',
    'description': 'Path to files directory.',
    'default': defaults.files.replace(/^~/, process.env.HOME)
};

Bones.Command.options['verbose'] = {
    'title': 'verbose=on|off',
    'description': 'verbose logging',
    'default': defaults.verbose
};

// Host option is unused.
delete Bones.Command.options.host;
