#!/usr/bin/env node
process.title = 'tilemill';
// The TileMill application consists of:
//
//     +-----------------+
//     | tilemill client |
//     +-----------------+
//              |                   +----------------+
//     +-----------------+          |+----------------+
//     | express         | -------> ||+----------------+
//     | tilemill server | -------> +|| node-worker    |
//     +-----------------+           +| export process |
//                                    +----------------+
//
// ### /client
//
// The TileMill client which consists of a single static HTML page and
// client-side javascript.
//
// ### /server
//
// The TileMill server which communicates to the client using JSON over HTTP
// requests.
//
// ### /server/export-worker.js
//
// `node-worker` export process created whenever a map export is requested by
// the user. Each of these export jobs run in a separate node process.
//
// ### /modules
//
// `backbone`, `underscore`, and `JSV` are libraries used by both the
// client and the server. The `/modules` directory is exposed to the client
// via `express.staticProvider` and contains both server-side and client-side
// modules.
//
// ### /shared
//
// The `/shared/models.js` file contains Backbone models and collections
// that are used on both the client and server.
//
// This file is the main Express server.
require.paths.splice(0, require.paths.length);
require.paths.unshift(
    __dirname + '/node_modules',
    __dirname + '/server',
    __dirname + '/shared',
    __dirname
);

var express = require('express'),
    mirror = require('mirror'),
    settings = require('settings');

var app = module.exports = express.createServer();

app.use(express.bodyParser());
app.use(express.static('client'));
app.use(express.static('shared'));

var scripts = [
    './client/js/libraries/jquery.js',
    './client/js/libraries/jquery-ui.js',
    './client/js/libraries/colorpicker/js/colorpicker.js',
    './build/vendor.js',
    './client/js/parsecarto.js',
    require.resolve('wax/build/wax.mm.min.js'),
    require.resolve('underscore/underscore.js'),
    require.resolve('backbone/backbone.js'),
    require.resolve('JSV/lib/uri/uri.js'),
    require.resolve('JSV/lib/jsv.js'),
    require.resolve('JSV/lib/json-schema-draft-03.js'),
    './shared/models.js'
];
app.get('/vendor.js', mirror.assets(scripts));

var stylesheets = ['./build/vendor.css'];
app.get('/vendor.css', mirror.assets(stylesheets));

require('bootstrap')(app, settings);
require('api')(app, settings);
require('tiles')(app, settings);
require('export')(app, settings);

if (app.settings.env !== 'test') {
    app.listen(settings.port);
    console.log('Started TileMill on port %d.', settings.port);
}
