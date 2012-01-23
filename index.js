#!/usr/bin/env node

var fs = require('fs');

process.title = 'tilemill';

// This is necessary to make optimist not special-case into coffeescript as
// certain node installs (e.g. ubuntu node ppa) do not use `node` as the binary
// name.
process.argv[0] = 'node';

if (process.platform === 'win32') {

    // HOME is undefined on windows
    process.env.HOME = process.env.USERPROFILE;

    // don't attempt symlink support at all -- just copy.
    // @TODO write a dotfile next to the copy with the link
    // "metadata" so we can monkeypatch readlink as well.
    var cprSync = require('./lib/fsutil').cprSync;
    fs.symlink = function(from,to,cb) {
        try {
            cprSync(from, to);
            return cb();
        } catch (err) {
            return cb(err);
        }
    }
}

// Default --config flag to user's home .tilemill.json config file.
// @TODO find a more elegant way to set a default for this value
// upstream in bones.
var path = require('path');
var config = path.join(process.env.HOME, '.tilemill/config.json');
if (path.existsSync(config)) {
    var argv = require('optimist').argv;
    argv.config = argv.config || config;
}

require('tilelive-mapnik').registerProtocols(require('tilelive'));
require('mbtiles').registerProtocols(require('tilelive'));

require('bones').load(__dirname);
!module.parent && require('bones').start();
