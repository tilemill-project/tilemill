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

var project3 = fs.readFileSync('./test/fixtures/project3.json', 'utf8');

module.exports = {
    'layer-load': function() {
        // Load layer
        assert.response(app, {url: '/api/Datasource/?ds_type=postgis&host=localhost&port=5432&password=&dbname=tilemill_test&table=admin_0_line_land&geometry_field=the_geom&extent=-15312095,-6980576.5,15693558,11093272&type=postgis'}, {
            status: 200
        }, function(res) {
            var data = JSON.parse(res.body);
            assert.deepEqual(data.extent, [-15312095, -6980576.5, 15693558, 11093272], 'Invalid extent.')
            assert.deepEqual(data.features, [], 'Unexpected features.');
        });
    },
    'layer-inspect': function() {
        assert.response(app, {url: '/api/Datasource/features?ds_type=postgis&host=localhost&port=5432&password=&dbname=tilemill_test&table=admin_0_line_land&geometry_field=the_geom&extent=-15312095,-6980576.5,15693558,11093272&type=postgis'}, {
            status: 200
        }, function(res) {
            var data = JSON.parse(res.body);
            assert.equal(data.fields.scalerank.type, 'Number', 'Missing field metadata');
            assert.equal(data.features.length, 344, 'Feature count mismatch');
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
            data: project3
        }, {
            status: 200
        }, function(res) {
            assert.deepEqual(_.keys(JSON.parse(res.body)), ['_updated']);
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
    }
};