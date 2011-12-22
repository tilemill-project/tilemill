#!/usr/bin/env node
process.title = 'tilemill';

// This is necessary to make optimist not special-case into coffeescript as
// certain node installs (e.g. ubuntu node ppa) do not use `node` as the binary
// name.
process.argv[0] = 'node';

// Default --config flag to user's home .tilemill.json config file.
// @TODO find a more elegant way to set a default for this value
// upstream in bones.
var path = require('path');
var config = path.join(process.env.HOME, '.tilemill/config.json');
if (path.existsSync(config)) {
    var argv = require('bones/node_modules/optimist').argv;
    argv.config = argv.config || config;
}

require('tilelive-mapnik').registerProtocols(require('tilelive'));
require('mbtiles').registerProtocols(require('tilelive'));

require('bones').load(__dirname);
!module.parent && require('bones').start();
