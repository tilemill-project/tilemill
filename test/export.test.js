var assert = require('assert');
var fs = require('fs');

function readJSON(name) {
    var json = fs.readFileSync('./test/fixtures/' + name + '.json', 'utf8');
    return JSON.parse(json);
}

require('./support/start')(function(command) {

    exports['test export job creation'] = function(beforeExit) {
        var completed = false;
        var created = Date.now()
        var id = String(created);
        var job = readJSON('export-job');
        var token = job['bones.token'];
        job.created = created;
        job.id = id;

        assert.response(command.servers['Core'], {
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
            assert.response(command.servers['Core'], {
                url: '/api/Export'
            }, { status: 200 }, function(res) {
                var body = JSON.parse(res.body);
                job.status = "processing";
                delete job['bones.token'];
                assert.ok(body[0].pid);
                delete body[0].pid;
                assert.deepEqual([job], body);

                job['bones.token'] = token;
                assert.response(command.servers['Core'], {
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
                    assert.response(command.servers['Core'], {
                        url: '/api/Export'
                    }, { status: 200 }, function(res) {
                        completed = true;
                        var body = JSON.parse(res.body);
                        assert.deepEqual([], body);
                    });
                });
            });
        });

        beforeExit(function() {
            assert.ok(completed);
        })
    };
});




