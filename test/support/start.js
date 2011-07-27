// process.env.NODE_ENV = 'test';
process.argv[2] = 'start';

var exec = require('child_process').exec;

// Load application. This file's purpose is to start TileMill only once and
// share the server with all tests.
require('../..');
var tilemill = require('bones').plugin;

tilemill.config.files = './test/fixtures/files';

var started = false, waiting = [];
var command = tilemill.start(function() {
    exec('./test/support/init.sh', function(err) {
        if (err) throw err;
        console.warn('Initialized test fixture');
        started = true;
        for (var fn; fn = waiting.shift();) fn(command);
    });
});

module.exports = function(cb) {
    if (started) cb(command);
    else waiting.push(cb);
};
