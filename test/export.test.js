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
var antiMeridianJob = readJSON('anti-meridian-export-job');
var token = job['bones.token'];
job.id = id;
antiMeridianJob.id = id + 1;
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
it('PUT create export job spanning the anti-meridian', function(done) {
    assert.response(core, {
        url: '/api/Export/' + antiMeridianJob.id,
        method: 'PUT',
        data: JSON.stringify(antiMeridianJob),
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
it("GET anti-meridian job to see if it succeeded", function(done) {
    function ping() {
        assert.response(core, {
            url: '/api/Export/' + antiMeridianJob.id,
            method: 'GET',
            headers: {
                cookie: "bones.token=" + token,
                'content-type': "application/json"
            }
        }, {
            status: 200
        }, function(res) {
            var data = JSON.parse(res.body);
            if (data.status === 'processing') {
                // Don't flood the socket or the test will fail.
                setTimeout(ping, 1000);
            } else if (data.status === 'error') {
                throw new Error(data.error);
            } else {
                antiMeridianJob.status = "complete";
                antiMeridianJob.progress = 1;
                console.log(data);
                assert.ok(data.pid);
                assert.ok(data.created);
                delete antiMeridianJob['bones.token'];
                delete data.created;
                delete data.pid;

                delete data.remaining;
                delete data.updated;
                delete data.rate;

                assert.deepEqual(antiMeridianJob, data);
                done();
            }
        });
    }
    ping();
});
it('DELETE should remove anti-meridian export job', function(done) {
    job['bones.token'] = token;
    assert.response(core, {
        url: '/api/Export/' + antiMeridianJob.id,
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
