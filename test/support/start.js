process.env.NODE_ENV = 'test';
process.argv[2] = 'test';

var http = require('http');
var util = require('util');
var assert = require('assert');
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var basedir = path.resolve(__dirname + '/..');

process.env.HOME = path.resolve(__dirname + '/../fixtures/files');

// Remove stale config file if present.
try { fs.unlinkSync(process.env.HOME + '/.tilemill/config.json'); }
catch (err) { if (err.code !== 'ENOENT') throw err }

// Load application.
require('../..');
var tilemill = require('bones').plugin;
tilemill.config.files = path.resolve(__dirname + '/../fixtures/files');
tilemill.config.examples = false;

module.exports.start = function(done) {
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
        var command = tilemill.start(function() {
            done(command);
        });
    });
};

module.exports.startPostgis = function(done) {
    var insert = '\
        psql -d postgres -c "DROP DATABASE IF EXISTS tilemill_test;" && \
        createdb -E UTF8 -T template_postgis tilemill_test && \
        psql -d tilemill_test -f ' + basedir + '/fixtures/tilemill_test.sql';
    exec(insert, function(err) {
        if (err) throw err;
        console.warn('Inserted postgres fixture.');
        module.exports.start(done);
    });
};

/**
 * Assert response from `server` with
 * the given `req` object and `res` assertions object.
 *
 * @param {Server} server
 * @param {Object} req
 * @param {Object|Function} res
 * @param {String} msg
 */
assert.response = function(server, req, res, msg) {
    // Callback as third or fourth arg
    var callback = typeof res === 'function'
        ? res
        : typeof msg === 'function'
            ? msg
            : function() {};

    // Default messate to test title
    if (typeof msg === 'function') msg = null;
    msg = msg || '';

    // Issue request
    var timer,
        method = req.method || 'GET',
        status = res.status || res.statusCode,
        data = req.data || req.body,
        requestTimeout = req.timeout || 0,
        encoding = req.encoding || 'utf8';

    var request = http.request({
        host: '127.0.0.1',
        port: server.port,
        path: req.url,
        method: method,
        headers: req.headers
    });

    var check = function() {
        if (--server.__pending === 0) {
            server.close();
            server.__listening = false;
        }
    };

    // Timeout
    if (requestTimeout) {
        timer = setTimeout(function() {
            check();
            delete req.timeout;
            throw new Error(msg + 'Request timed out after ' + requestTimeout + 'ms.');
        }, requestTimeout);
    }

    if (data) request.write(data);

    request.on('response', function(response) {
        response.body = '';
        response.setEncoding(encoding);
        response.on('data', function(chunk) { response.body += chunk; });
        response.on('end', function() {
            if (timer) clearTimeout(timer);
            // Assert response body
            if (res.body !== undefined) {
                var eql = res.body instanceof RegExp
                  ? res.body.test(response.body)
                  : res.body === response.body;
                assert.ok(
                    eql,
                    msg + 'Invalid response body.\n'
                        + '    Expected: ' + util.inspect(res.body) + '\n'
                        + '    Got: ' + util.inspect(response.body)
                );
            }

            // Assert response status
            if (typeof status === 'number') {
                assert.equal(
                    response.statusCode,
                    status,
                    msg + 'Invalid response status code.\n'
                        + '     Expected: ' + status + '\n'
                        + '     Got: ' + response.statusCode + ''
                );
            }

            // Assert response headers
            if (res.headers) {
                var keys = Object.keys(res.headers);
                for (var i = 0, len = keys.length; i < len; ++i) {
                    var name = keys[i],
                        actual = response.headers[name.toLowerCase()],
                        expected = res.headers[name],
                        eql = expected instanceof RegExp
                          ? expected.test(actual)
                          : expected == actual;
                        assert.ok(
                            eql,
                            msg + 'Invalid response header ' + name + '.\n'
                                + '    Expected: ' + expected + '\n'
                                + '    Got: ' + actual
                        );
                }
            }
            // Callback
            callback(response);
        });
    });

    request.end();

};

/**
 * Assert that `str` matches `regexp`.
 *
 * @param {String} str
 * @param {RegExp} regexp
 * @param {String} msg
 */
assert.match = function(str, regexp, msg) {
    msg = msg || util.inspect(str) + ' does not match ' + util.inspect(regexp);
    assert.ok(regexp.test(str), msg);
};

