#!/usr/bin/env node

var cp = require('child_process');

var prefix = '[tilemill configure] ';

function mapnik_config(callback) {
    cp.execFile('mapnik-config', ['--version'], function(err, stdout, stderr) {
        if (err || stderr) {
            return callback(err || new Error(stderr.trim()));
        } else {
            return callback(null,stdout.trim());
        }
    });
}

function protobuf_config(callback) {
    if (process.platform === 'win32') {
        return callback(null,'skipped protobuf check');
    } else {
        cp.execFile('pkg-config', ['protobuf','--version'], function(err, stdout, stderr) {
            if (err || stderr) {
                return callback(err || new Error(stderr.trim()));
            } else {
                return callback(null,stdout.trim());
            }
        });
    }
}

mapnik_config(function(err,result) {
    console.log(prefix + 'Using node v'+ process.versions.node);
    if(err) {
        console.error(prefix + 'Could not configure TileMill because the "mapnik-config" program was not found (' + err.message + ')');
        process.exit(1);
    } else {
        console.log(prefix + 'Successfully found mapnik version v'+result + ' (via mapnik-config)');
        protobuf_config(function(err,result) {
            if (err) {
                console.error(prefix + 'Could not configure TileMill because "pkg-config protobuf --version" returned an error (' + err.message + ')');
            } else {
                console.log(prefix + 'Found libprotobuf v'+result)
                process.exit(0);
            }
        });
    }
});
