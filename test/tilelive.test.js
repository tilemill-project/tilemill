require.paths.unshift(__dirname + '/../lib/node', __dirname + '/../');
var assert = require('assert');
var fs = require('fs');

var app = require('tilemill');
var inspect = require('inspect');

var project = '';
var project2 = '';
module.exports = {
    'abilities': function() {
        assert.response(app, { url: '/abilities' }, {
            status: 200
        }, function(res) {
            var data = JSON.parse(res.body);
            assert.ok(data.fonts, 'Available fonts');
            assert.ok(data.datasources, 'Available datasources');
        });
    },
    'version': function() {
        assert.response(app, {
            url: '/api',
        }, {
            status: 200
        }, function(res) {
            var data = JSON.parse(res.body);
            assert.equal(data.api, 'basic', 'API');
            assert.equal(data.version, 1, 'API Version');
        });
    },
    'project manipulation': function() {
        fs.readFile('./test/fixtures/project1.json', 'utf8', function(err, project) {
            assert.response(app, {
                url: '/api/project/Test',
                method: 'PUT',
                headers: {
                    'content-type': 'application/json'
                },
                data: project
            }, {
                status: 200
            }, function(res) {
                assert.equal(JSON.stringify(JSON.parse(res.body)), JSON.stringify(JSON.parse(project)));
            });
            // Get project
            assert.response(app, {
                url: '/api/project/Test',
                method: 'GET',
            }, {
                status: 200
            }, function(res) {
                assert.equal(JSON.stringify(JSON.parse(res.body)), JSON.stringify(JSON.parse(project)));
            });

            fs.readFile('./test/fixtures/project2.json', 'utf8', function(err, project) {
                // Update project
                assert.response(app, {
                    url: '/api/project/Test',
                    method: 'PUT',
                    headers: {
                        'content-type': 'application/json'
                    },
                    data: project
                }, {
                    status: 200
                }, function(res) {
                    assert.equal(JSON.stringify(JSON.parse(res.body)), JSON.stringify(JSON.parse(project)));
                });
                // Load layer
                assert.response(app, {url: '/aHR0cDovL2xvY2FsaG9zdDo4ODg5L2FwaS9wcm9qZWN0L1Rlc3Q_MDI3N2M0/world'}, {
                    status: 200
                }, function(res) {
                    var data = JSON.parse(res.body);
                    assert.equal(data.id, 'world', 'Unexpected layer id');
                    assert.equal(data.features.length, 245, 'Feature count mismatch');
                });
                // Delete project
                assert.response(app, {
                    url: '/api/project/Test',
                    method: 'DELETE'
                }, {
                    status: 200
                }, function(res) {
                    assert.equal(res.body, '{}');
                });
            });
        });
    },
    'invalid map': function() {
        assert.response(app, { url: '/foobar' }, {
            status: 500
        }, function(res) {
            var data = JSON.parse(res.body);
            assert.equal(data.message, 'Error loading map file', 'Unexpected error message');
        });
    }
};

var loadFixture = function(file, callback) {
    require('fs').readfile('./test/fixtures/' + file, callback);
}
