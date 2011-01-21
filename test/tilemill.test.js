require.paths.unshift(__dirname + '/../lib/node', __dirname + '/../');
var assert = require('assert');
var fs = require('fs');
var _ = require('underscore')._;
var app = require('tilemill');

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
    'project': function() {
        var project1 = fs.readFileSync('./test/fixtures/project1.json', 'utf8');
        var project2 = fs.readFileSync('./test/fixtures/project2.json', 'utf8');
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
        // Get all projects
        assert.response(app, {
            url: '/api/Project',
            method: 'GET',
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(JSON.parse(res.body).pop(), JSON.parse(project1));
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
            assert.equal(res.body, 'Name must contain only letters, numbers, dashes, and underscores.');
        });
        // Validation: No stylesheets found.
        var invalid = _.extend(JSON.parse(project1), {
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
        var invalid = _.extend(JSON.parse(project1), {
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
            assert.equal(JSON.parse(res.body)[0].message, 'Invalid value for polygon-fill, a color is expected');
        });
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
    },
    'settings': function() {
        var settings1 = fs.readFileSync('./test/fixtures/settings1.json', 'utf8');
        var settings2 = fs.readFileSync('./test/fixtures/settings2.json', 'utf8');
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
            assert.equal(res.body, 'Invalid editor mode specified.');
        });
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
        // Delete settings
        assert.response(app, {
            url: '/api/Settings/settings',
            method: 'DELETE'
        }, {
            status: 200
        }, function(res) {
            assert.equal(res.body, '{}');
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

