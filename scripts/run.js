#!/usr/bin/env node

// Generic node.js execution wrapper to exclude win32 from runs
// without failing on windows.

if (process.platform !== 'win32') runscript();

function runscript() {
    var execFile = require('child_process').execFile;
    var path = require('path');
    var file = path.resolve(process.argv[2]);
    console.log('Running %s', file);
    execFile(file, [], {}, function(err, stdout, stderr) {
        console.log(stdout);
        console.warn(stderr);
        if (err && err.code) {
            process.exit(err.code);
        }
        process.exit(0);
    });
}