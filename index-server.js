#!/usr/bin/env node

// increase the libuv threadpool size to 1.5x the number of logical CPUs.
process.env.UV_THREADPOOL_SIZE = Math.ceil(Math.max(4, require('os').cpus().length * 1.5));
process.env.OPENFILEGDB_IN_MEMORY_SPI = "OFF";
var path = require('path');
process.env.MAPNIK_FONT_PATH = path.join(__dirname,'fonts');

var fs = require('fs');
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
    // Add custom library paths to the PATH
    process.env.PATH = path.join(__dirname,"node_modules/mapnik/lib/binding/") +
        ";" + path.join(__dirname,"node_modules/zipfile/lib");
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