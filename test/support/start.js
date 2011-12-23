process.env.NODE_ENV = 'test';
process.argv[2] = 'test';

var Queue = require('../../lib/queue');
var Step = require('step');
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var basedir = path.resolve(__dirname + '/..');

process.env.HOME = path.resolve(__dirname + '/../fixtures/files');

// Remove stale config file if present.
try { fs.unlinkSync(process.env.HOME + '/.tilemill.json'); }
catch (err) { if (err.code !== 'ENOENT') throw err }

// Load application.
require('../..');
var tilemill = require('bones').plugin;
tilemill.config.files = path.resolve(__dirname + '/../fixtures/files');
tilemill.config.examples = false;

var queue = new Queue(function(next, done) {
    // Allow bootstrap functions to be added to the queue.
    if (next.bootstrap) return next(done);

    var command = tilemill.start(function() {
        var remaining = 2;
        command.servers['Core'].close = (function(parent) { return function() {
            if (remaining-- === 1) done();
            return parent.apply(this, arguments);
        }})(command.servers['Core'].close);
        command.servers['Tile'].close = (function(parent) { return function() {
            if (remaining-- === 1) done();
            return parent.apply(this, arguments);
        }})(command.servers['Tile'].close);
        next(command);
    });
}, 1);
// @TODO:
// Not sure why this is necessary. tile.test.js doesn't seem to exit out
// despite both servers closing.
queue.on('empty', process.exit);

// Insert postgis fixture only once for all tests as they will not be
// modified. Queued first after which the remaining tests run.
var postgis = function(callback) {
    var insert = '\
        psql -d postgres -c "DROP DATABASE IF EXISTS tilemill_test;" && \
        createdb -E UTF8 -T template_postgis tilemill_test && \
        psql -d tilemill_test -f ' + basedir + '/fixtures/tilemill_test.sql';
    exec(insert, function(err) {
        if (err) throw err;
        console.warn('Inserted postgres fixture.');
        callback();
    });
};
postgis.bootstrap = true;
queue.add(postgis);

tilemill.commands.test.augment({
    bootstrap: function(parent, plugin, callback) {
        // Create a clean environment.
        var clean = '\
            rm -f ' + basedir + '/fixtures/files/app.db && \
            rm -rf ' + basedir + '/fixtures/files/project && \
            rm -rf ' + basedir + '/fixtures/files/data && \
            rm -rf ' + basedir + '/fixtures/files/export && \
            cp -R ' + basedir + '/fixtures/pristine/project ' + basedir + '/fixtures/files';
        exec(clean, function(err) {
            if (err) throw err;
            console.warn('Initialized test fixture');
            parent.call(this, plugin, callback);
        }.bind(this));
    }
});

module.exports = queue.add;

