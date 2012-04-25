var _ = require('underscore');
var assert = require('assert');
var Step = require('step');
var core;
var tile;

// Reduce config response body down to attributes we care about.
var attr = function(body) {
    var data = JSON.parse(body);
    return _(data).reduce(function(memo, val, key) {
        if ('files examples host port sampledata listenHost bufferSize'.indexOf(key) >= 0) {
            memo[key] = val;
        }
        return memo;
    }, {});
};

describe('config', function() {

before(function(done) {
    require('./support/start').start(function(command) {
        core = command.servers['Core'];
        tile = command.servers['Tile'];
        done();
    });
});

after(function(done) {
    core.close();
    tile.close();
    done();
});

it('GET should return JSON', function(done) {
    assert.response(core,
        { url: '/api/Config/config' },
        { status:200 },
        function(res) {
            assert.deepEqual(attr(res.body), {
                'files': '~',
                'examples': false,
                'host': [],
                'port': 20009,
                'sampledata': true,
                'listenHost': '127.0.0.1',
                'bufferSize': 128
            });
            done();
        }
    );
});
it('PUT should update config', function(done) {
    assert.response(core,
        {
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
        },
        { status:200 },
        function(res) {
            assert.deepEqual(attr(res.body), {});
            done();
        }
    );
});
it('GET should return updated config', function(done) {
    assert.response(core,
        { url: '/api/Config/config' },
        { status:200 },
        function(res) {
            assert.deepEqual(attr(res.body), {
                'files': '~',
                'examples': false,
                'host': [],
                'port': 20009,
                'sampledata': true,
                'listenHost': '127.0.0.1',
                'bufferSize': 1024
            });
            done();
        }
    );
});
it('PUT should 409 on invalid config', function(done) {
    assert.response(core,
        {
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
        },
        { status:409 },
        function(res) {
            assert.equal(res.body, 'Instance is not a required type (bufferSize)');
            done();
        }
    );
});
it('DELETE should 409', function(done) {
    assert.response(core,
        {
            url: '/api/Config/config',
            method: 'DELETE',
            headers: {
                'content-type': 'application/json',
                'cookie': 'bones.token=asdf'
            },
            data: JSON.stringify({ 'bones.token': 'asdf' })
        },
        { status:409 },
        function(res) {
            assert.equal(res.body, 'Method not supported.');
            done();
        }
    );
});

});
