require.paths.unshift(__dirname + '/../lib/node', __dirname + '/../');
var assert = require('assert');
var fs = require('fs');
var _ = require('underscore')._;

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
            // Create project
            assert.response(app, {
                url: '/api/Project/Test',
                method: 'PUT',
                headers: {
                    'content-type': 'application/json'
                },
                data: project
            }, {
                status: 200
            }, function(res) {
                assert.deepEqual(JSON.parse(res.body), JSON.parse(project));
            });
            // Get all projects
            assert.response(app, {
                url: '/api/Project',
                method: 'GET',
            }, {
                status: 200
            }, function(res) {
                assert.deepEqual(JSON.parse(res.body).pop(), JSON.parse(project));
            });
            // Get project
            assert.response(app, {
                url: '/api/Project/Test',
                method: 'GET',
            }, {
                status: 200
            }, function(res) {
                assert.deepEqual(JSON.parse(res.body), JSON.parse(project));
            });
            // Validation: Name must contain specified characters.
            var invalid = _.extend(JSON.parse(project), { id: 'Bad !@!ID' });
            assert.response(app, {
                url: '/api/Project/Test',
                method: 'PUT',
                headers: {
                    'content-type': 'application/json'
                },
                data: JSON.stringify(invalid)
            }, {
                status: 500
            }, function(res) {
                assert.equal(res.body, 'Name must contain only letters, numbers, dashes, and underscores.');
            });
            // Validation: No stylesheets found.
            var invalid = _.extend(JSON.parse(project), {
                Stylesheet: []
            });
            assert.response(app, {
                url: '/api/Project/Test',
                method: 'PUT',
                headers: {
                    'content-type': 'application/json'
                },
                data: JSON.stringify(invalid)
            }, {
                status: 500
            }, function(res) {
                assert.equal(res.body, 'No stylesheets found.');
            });
            // Validation: Stylesheet IDs must be unique.
            var invalid = _.extend(JSON.parse(project), {
                Stylesheet: [
                    { id: 'foo', data: '' },
                    { id: 'foo', data: '' }
                ]
            });
            assert.response(app, {
                url: '/api/Project/Test',
                method: 'PUT',
                headers: {
                    'content-type': 'application/json'
                },
                data: JSON.stringify(invalid)
            }, {
                status: 500
            }, function(res) {
                assert.equal(res.body, 'Stylesheet IDs must be unique.');
            });
            // Validation: Stylesheet syntax validation.
            var invalid = _.extend(JSON.parse(project), {
                Stylesheet: [
                    { id: 'style.mss', data: '#world {  polygon-fill: eee; }' },
                ]
            });
            assert.response(app, {
                url: '/api/Project/Test',
                method: 'PUT',
                headers: {
                    'content-type': 'application/json'
                },
                data: JSON.stringify(invalid)
            }, {
                status: 500
            }, function(res) {
                assert.equal(JSON.parse(res.body)[0].message, 'Invalid value for polygon-fill, a color is expected');
            });
            fs.readFile('./test/fixtures/project2.json', 'utf8', function(err, project) {
                // Update project
                assert.response(app, {
                    url: '/api/Project/Test',
                    method: 'PUT',
                    headers: {
                        'content-type': 'application/json'
                    },
                    data: project
                }, {
                    status: 200
                }, function(res) {
                    assert.deepEqual(JSON.parse(res.body), JSON.parse(project));
                });
                // Load layer
                assert.response(app, {url: '/aHR0cDovL2xvY2FsaG9zdDo4ODg5L2FwaS9Qcm9qZWN0L1Rlc3Q_MmE5ZWFj/world'}, {
                    status: 200
                }, function(res) {
                    var data = JSON.parse(res.body);
                    assert.equal(data.id, 'world', 'Unexpected layer id');
                    assert.equal(data.features.length, 245, 'Feature count mismatch');
                });
                // Delete project
                assert.response(app, {
                    url: '/api/Project/Test',
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
