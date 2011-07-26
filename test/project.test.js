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

    exports['test project endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/api/Project/demo_01' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                cleanProject(body);
                assert.deepEqual(readJSON('existing-project'), body);
            }
        );
    };

    exports['test project creation'] = function() {
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
                }
            );
        });


    };
});
