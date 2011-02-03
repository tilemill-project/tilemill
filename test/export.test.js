require.paths.unshift(__dirname + '/../lib/node', __dirname + '/../');

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
var exportjob1 = fs.readFileSync('./test/fixtures/exportjob1.json', 'utf8');

module.exports = {
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
    'export-create': function() {
        // Create export
        assert.response(app, {
            url: '/api/Export/6566fe',
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            data: exportjob1
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(JSON.parse(res.body), JSON.parse(exportjob1));
        });
    },
    'export-test': function() {
        // Get export
        assert.response(app, {
            url: '/api/Export/6566fe',
            method: 'GET'
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(JSON.parse(res.body), JSON.parse(exportjob1));
        });
    },
    'export-delete': function() {
        // Delete export
        assert.response(app, {
            url: '/api/Export/6566fe',
            method: 'DELETE'
        }, {
            status: 200
        }, function(res) {
            assert.equal(res.body, '{}');
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
    }
}
