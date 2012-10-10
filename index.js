#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
// node v6 -> v8 compatibility
var existsSync = require('fs').existsSync || require('path').existsSync;

process.title = 'tilemill';

// This is necessary to make optimist not special-case into coffeescript as
// certain node installs (e.g. ubuntu node ppa) do not use `node` as the binary
// name.
process.argv[0] = 'node';

if (process.platform === 'win32') {
    // HOME is undefined on windows
    process.env.HOME = process.env.USERPROFILE;
    process.env.PATH = "node_modules/mapnik/lib/mapnik/lib;node_modules/zipfile/lib;"+process.env.PATH;
}

// Default --config flag to user's home .tilemill.json config file.
// @TODO find a more elegant way to set a default for this value
// upstream in bones.
var config = path.join(process.env.HOME, '.tilemill/config.json');
if (existsSync(config)) {
    var argv = require('optimist').argv;
    argv.config = argv.config || config;
}

require('tilelive-mapnik').registerProtocols(require('tilelive'));
require('mbtiles').registerProtocols(require('tilelive'));

require('bones').load(__dirname);
!module.parent && require('bones').start();
