process.env.NODE_ENV = 'test';
process.argv[2] = 'start';

var Step = require('step');
var exec = require('child_process').exec;
var path = require('path');
process.env.HOME = path.resolve(__dirname + '/../fixtures/files');

// Load application. This file's purpose is to start TileMill only once and
// share the server with all tests.
require('../..');
var tilemill = require('bones').plugin;
tilemill.config.files = './test/fixtures/files';
tilemill.config.examples = false;
tilemill.commands.start.augment({
    bootstrap: function(parent, plugin, callback) {
        // Create a clean environment.
        var basedir = path.resolve(__dirname + '/..');
        var clean = '\
            rm -f ' + basedir + '/fixtures/files/app.db && \
            rm -rf ' + basedir + '/fixtures/files/project && \
            rm -rf ' + basedir + '/fixtures/files/data && \
            rm -rf ' + basedir + '/fixtures/files/export && \
            cp -R ' + basedir + '/fixtures/pristine/project ' + basedir + '/fixtures/files && \
            psql -d postgres -c "DROP DATABASE IF EXISTS tilemill_test;" && \
            createdb -E UTF8 -T template_postgis tilemill_test && \
            psql -d tilemill_test -f ' + basedir + '/fixtures/tilemill_test.sql';
        exec(clean, function(err) {
            if (err) throw err;
            console.warn('Initialized test fixture');
            parent.call(this, plugin, callback);
        }.bind(this));
    }
});

var started = false, waiting = [];
var command = tilemill.start(function() {
    started = true;
    for (var fn; fn = waiting.shift();) fn(command);
});

module.exports = function(cb) {
    if (started) cb(command);
    else waiting.push(cb);
};
