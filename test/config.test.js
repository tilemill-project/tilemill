var assert = require('assert');
var Step = require('step');

require('./support/start')(function(command) {
command.servers['Tile'].close();

exports['config'] = function() {

var server = command.servers['Core'];

// GET config
Step(function() {
    assert.response(server, {
        url: '/api/Config/config'
    }, { status:200 }, this);
}, function(res) {
    assert.deepEqual(JSON.parse(res.body), {
        'files': '~',
        'examples': false,
        'host': [],
        'port': 20009,
        'sampledata': true,
        'listenHost': '127.0.0.1',
        'bufferSize': 128
    });
    this();
// PUT config
}, function() {
    assert.response(server, {
        url: '/api/Config/config',
        method: 'PUT',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=asdf'
        },
        data: JSON.stringify({
            'bufferSize': 1024,
            'bones.token': 'asdf'
        })
    }, { status:200 }, this);
}, function(res) {
    assert.response(server, {
        url: '/api/Config/config',
        method: 'GET'
    }, { status:200 }, this);
// Confirm PUT
}, function(res) {
    assert.deepEqual(JSON.parse(res.body), {
        'files': '~',
        'bufferSize': 1024,
        'examples': false,
        'host': [],
        'port': 20009,
        'sampledata': true,
        'listenHost': '127.0.0.1'
    });
    this();
// PUT invalid config
}, function() {
    assert.response(server, {
        url: '/api/Config/config',
        method: 'PUT',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=asdf'
        },
        data: JSON.stringify({
            'bufferSize': 'asdf',
            'bones.token': 'asdf'
        })
    }, { status:409 }, this);
}, function(res) {
    assert.equal(res.body, 'Error: Instance is not a required type (bufferSize)');
    this();
// DELETE config
}, function() {
    assert.response(server, {
        url: '/api/Config/config',
        method: 'DELETE',
        headers: {
            'content-type': 'application/json',
            'cookie': 'bones.token=asdf'
        },
        data: JSON.stringify({ 'bones.token': 'asdf' })
    }, { status:409 }, this);
}, function(res) {
    assert.equal(res.body, 'Method not supported.');
});

}});

