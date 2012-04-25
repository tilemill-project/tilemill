var assert = require('assert');
var fs = require('fs');
var path = require('path');
var core;
var tile;

function readJSON(name) {
    var json = fs.readFileSync(path.resolve(__dirname + '/fixtures/' + name + '.json'), 'utf8');
    return JSON.parse(json);
}

describe('export', function() {

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

var id = Date.now().toString();
var job = readJSON('export-job');
var token = job['bones.token'];
job.id = id;
it('PUT should create export job', function(done) {
    assert.response(core, {
        url: '/api/Export/' + id,
        method: 'PUT',
        data: JSON.stringify(job),
        headers: {
            cookie: "bones.token=" + token,
            'content-type': "application/json"
        }
    }, {
        body: '{}',
        status: 200
    }, function (res) {
        assert.deepEqual(JSON.parse(res.body), {});
        done();
    });
});
it('GET should retrieve export job', function(done) {
    assert.response(core, {
        url: '/api/Export'
    }, { status: 200 }, function(res) {
        var body = JSON.parse(res.body);
        job.status = "processing";
        assert.ok(body[0].pid);
        assert.ok(body[0].created);
        delete job['bones.token'];
        delete body[0].created;
        delete body[0].pid;
        assert.deepEqual(job, body[0]);
        done();
    });
});
it('DELETE should stop export job', function(done) {
    job['bones.token'] = token;
    assert.response(core, {
        url: '/api/Export/' + id,
        method: 'DELETE',
        headers: {
            cookie: "bones.token=" + token,
            'content-type': "application/json"
        },
        body: JSON.stringify(job)
    }, {
        body: '{}',
        status: 200
    }, function (res) {
        assert.deepEqual(JSON.parse(res.body), {});
        done();
    });
});
it('GET should find no export jobs', function(done) {
    assert.response(core, {
        url: '/api/Export'
    }, { status: 200 }, function(res) {
        assert.deepEqual([], JSON.parse(res.body));
        done();
    });
});

});
