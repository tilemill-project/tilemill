var assert = require('assert');
var fs = require('fs');

function readJSON(name) {
    var json = fs.readFileSync('./test/fixtures/' + name + '.json', 'utf8');
    return JSON.parse(json);
}

function removeTimestamp(url) {
    return url.replace(/\?\d+$/, '');
}

function cleanProject(proj) {
    if (!proj) return;
    delete proj._updated;
    if (Array.isArray(proj.tiles)) proj.tiles = proj.tiles.map(removeTimestamp);
    if (Array.isArray(proj.grids)) proj.grids = proj.grids.map(removeTimestamp);
}

require('./support/start')(function(command) {
    exports['test project collection endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/api/Project' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                cleanProject(body[0]);
                assert.deepEqual([readJSON('existing-project')], body);
            }
        );
    };

    exports['test project endpoint'] = function(beforeExit) {
        var completed = false;
        assert.response(command.servers['Core'],
            { url: '/api/Project/demo_01' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                var _updated = body._updated;
                cleanProject(body);
                assert.deepEqual(readJSON('existing-project'), body);

                // No new update.
                assert.response(command.servers['Core'],
                    { url: '/api/Project/demo_01/' + _updated },
                    { body: '{}', status: 200 }
                );

                // Update notification.
                assert.response(command.servers['Core'],
                    { url: '/api/Project/demo_01/' + (+_updated - 1000) },
                    { status: 200 },
                    function(res) {
                        var body = JSON.parse(res.body);
                        var _updated = body._updated;
                        cleanProject(body);
                        assert.deepEqual(readJSON('existing-project'), body);
                        completed = true;
                    }
                );
            }
        );

        beforeExit(function() {
            assert.ok(completed);
        })
    };

    exports['test project creation'] = function(beforeExit) {
        var completed = false;
        var data = readJSON('create-project');
        assert.response(command.servers['Core'], {
            url: '/api/Project/demo_02',
            method: 'PUT',
            headers: {
                'content-type': 'application/json',
                'cookie': 'bones.token=' + data['bones.token']
            },
            data: JSON.stringify(data)
        }, { status: 200 }, function(res) {
            var body = JSON.parse(res.body);
            cleanProject(body);
            assert.deepEqual({
                tiles: ["/1.0.0/demo_02/{z}/{x}/{y}.png"],
                grids: ["/1.0.0/demo_02/{z}/{x}/{y}.grid.json"]
            }, body);

            assert.response(command.servers['Core'],
                { url: '/api/Project/demo_02' },
                { status: 200 },
                function(res) {
                    var body = JSON.parse(res.body);
                    cleanProject(body);
                    assert.deepEqual(readJSON('created-project'), body);

                    assert.response(command.servers['Core'], {
                        url: '/api/Project/demo_02',
                        method: 'DELETE',
                        headers: {
                            'content-type': 'application/json',
                            'cookie': 'bones.token=' + data['bones.token']
                        },
                        data: JSON.stringify({ 'bones.token': data['bones.token'] })
                    }, { status: 200 }, function(res) {
                        assert.equal(res.body, '{}');
                        completed = true;
                    });
                }
            );
        });

        beforeExit(function() {
            assert.ok(completed);
        });
    };

    exports['test project creation with invalid id'] = function() {
        var data = readJSON('create-project');
        data.id = 'Bad !@!ID';
        assert.response(command.servers['Core'], {
            url: '/api/Project/Bad%20!@!ID',
            method: 'PUT',
            headers: {
                'content-type': 'application/json',
                'cookie': 'bones.token=' + data['bones.token'],
                'accept': 'application/json'
            },
            data: JSON.stringify(data)
        }, { status: 409 }, function(res) {
            var body = JSON.parse(res.body);
            delete body.stack;
            assert.deepEqual({
                message: "Error: Name may include alphanumeric characters, dashes and underscores.",
                status: 409
            }, body);
            assert['throws'](function() {
                fs.statSync('./test/fixtures/files/project/Bad !@!ID');
            }, "ENOENT, No such file or directory './test/fixtures/files/project/Bad !@!ID'");
        });
    };

    exports['test updating project with invalid stylesheet'] = function() {
        var data = readJSON('invalid-project');
        assert.response(command.servers['Core'], {
            url: '/api/Project/demo_01',
            method: 'PUT',
            headers: {
                'content-type': 'application/json',
                'cookie': 'bones.token=' + data['bones.token'],
                'accept': 'application/json'
            },
            data: JSON.stringify(data)
        }, { status: 409 }, function(res) {
            var body = JSON.parse(res.body);
            delete body.stack;
            assert.deepEqual({
                message: "Error: style.mss:2:2 Invalid value for background-color, a valid color is expected. blurb was given.",
                status: 409
            }, body);
        });
    };
});
