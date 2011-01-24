require.paths.unshift(__dirname + '/lib/node', __dirname);

var express = require('express'),
    settings = require('settings');

var app = module.exports = express.createServer();

app.use(express.bodyDecoder());
app.use(express.methodOverride());
app.use(express.staticProvider('client'));

app.error(function(err, req, res){
    res.send(err, 500);
});

require('./api')(app, settings);
require('./providers/providers')(app, settings);
require('./export')(app, settings);
require('./tilehandler')(app, settings);
require('./bootstrap')(app, settings);

if (app.settings.env !== 'test') {
    app.listen(settings.port);
    console.log('Started TileMill on port %d.', settings.port);
}
