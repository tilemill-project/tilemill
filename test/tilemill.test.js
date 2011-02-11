require.paths.splice(0, require.paths.length);
require.paths.unshift(
    __dirname + '/../lib/node',
    __dirname + '/../'
);

var settings = require('settings');
settings.files = __dirname + '/files';
settings.mapfile_dir = __dirname + '/files/.cache';
settings.data_dir = __dirname + '/files/.cache';
settings.export_dir = __dirname + '/files/export';

var assert = require('assert');
var fs = require('fs');
var _ = require('underscore')._;
var app = require('tilemill');

var project1 = fs.readFileSync('./test/fixtures/project1.json', 'utf8');
var project2 = fs.readFileSync('./test/fixtures/project2.json', 'utf8');
var settings1 = fs.readFileSync('./test/fixtures/settings1.json', 'utf8');
var settings2 = fs.readFileSync('./test/fixtures/settings2.json', 'utf8');

module.exports = {
    'abilities': function() {
        assert.response(app, { url: '/api/Abilities' }, {
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
            assert.equal(data.version, 1, 'API Version');
        });
    },
    'project-create': function() {
        // Create project
        assert.response(app, {
            url: '/api/Project/Test',
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            data: project1
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(JSON.parse(res.body), JSON.parse(project1));
        });
    },
    'project-test': function() {
        // Get all projects
        assert.response(app, {
            url: '/api/Project',
            method: 'GET',
        }, {
            status: 200
        }, function(res) {
            var projects = JSON.parse(res.body);
            for (var i = 0; i < projects.length; i++) {
                if (projects[i].id === 'Test') {
                    assert.deepEqual(projects[i], JSON.parse(project1));
                }
            }
        });
        // Get project
        assert.response(app, {
            url: '/api/Project/Test',
            method: 'GET',
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(JSON.parse(res.body), JSON.parse(project1));
        });
        // Validation: Name must contain specified characters.
        var invalid = _.extend(JSON.parse(project1), {
            id: 'Bad !@!ID'
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
            assert.equal(res.body, 'Name may include alphanumeric characters, dashes and underscores.');
        });
        // Validation: Stylesheet syntax validation.
        var invalid = _.extend(JSON.parse(project1), {
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
            assert.equal(JSON.parse(res.body)[0].message, 'Invalid value for polygon-fill, a valid color is expected. eee was given.');
        });
    },
    'project-tiles': function() {
        // Test a few project tiles
        assert.response(app, {
            url: '/1.0.0/Test/0/0/0.png',
            method: 'GET'
        }, {
            status: 200
        }, function(res) {
            assert.ok(res.body.length > 5000, 'Tile is unexpectedly small.');
        });
        assert.response(app, {
            url: '/1.0.0/Test/2/2/1.png',
            method: 'GET'
        }, {
            status: 200
        }, function(res) {
            assert.ok(res.body.length > 5000, 'Tile is unexpectedly small.');
        });
        // Test that an invalid project has no tiles
        // @TODO this test currently fails hard. Find out why.
        assert.response(app, {
            url: '/1.0.0/foobar/0/0/0.png',
            method: 'GET'
        }, {
            status: 500
        });
    },
    'project-update': function() {
        // Update project
        assert.response(app, {
            url: '/api/Project/Test',
            method: 'PUT',
            headers: {
                'content-type': 'application/json'
            },
            data: project2
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(JSON.parse(res.body), JSON.parse(project2));
        });
    },
    'project-delete': function() {
        // Delete project
        assert.response(app, {
            url: '/api/Project/Test',
            method: 'DELETE'
        }, {
            status: 200
        }, function(res) {
            assert.equal(res.body, '{}');
        });
    },
    'layer-load': function() {
        // Load layer
        assert.response(app, {url: '/api/Datasource/aHR0cDovL3RpbGVtaWxsLWRhdGEuczMuYW1hem9uYXdzLmNvbS9leGFtcGxlX2RhdGEvYWRtaW4tMC1saW5lLWxhbmQuemlw/features'}, {
            status: 200
        }, function(res) {
            var data = JSON.parse(res.body);
            assert.equal(data.fields.ScaleRank.type, 'Number', 'Missing field metadata');
            assert.equal(data.features.length, 344, 'Feature count mismatch');
        });
    },
    'settings-create': function() {
        // Create settings
        assert.response(app, {
            url: '/api/Settings/settings',
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            data: settings1
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(JSON.parse(res.body), JSON.parse(settings1));
        });
    },
    'settings-test': function() {
        // Get settings
        assert.response(app, {
            url: '/api/Settings/settings',
            method: 'GET',
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(JSON.parse(res.body), JSON.parse(settings1));
        });
        // Validation: mode may only be normal or minimal.
        var invalid = _.extend(JSON.parse(settings1), {
            mode: 'awesome'
        });
        assert.response(app, {
            url: '/api/Settings/settings',
            method: 'PUT',
            headers: {
                'content-type': 'application/json'
            },
            data: JSON.stringify(invalid)
        }, {
            status: 500
        }, function(res) {
            assert.equal(res.body, 'Editing mode may be \'normal\' or \'minimal\' to allow use of external editors.');
        });
    },
    'settings-update': function() {
        // Update settings
        assert.response(app, {
            url: '/api/Settings/settings',
            method: 'PUT',
            headers: {
                'content-type': 'application/json'
            },
            data: settings2
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(JSON.parse(res.body), JSON.parse(settings2));
        });
    },
    'settings-delete': function() {
        // Delete settings
        assert.response(app, {
            url: '/api/Settings/settings',
            method: 'DELETE'
        }, {
            status: 200
        }, function(res) {
            assert.equal(res.body, '{}');
        });
    }
};

