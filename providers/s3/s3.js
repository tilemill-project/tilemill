require.paths.unshift(__dirname + '/modules', __dirname + '/lib/node', __dirname);
var knox = require('knox'),
    sys = require('sys'),
    fs = require('fs'),
    url = require('url'),
    util = require('util'),
    _ = require('underscore')._,
    express = require('express'),
    querystring = require('querystring'),
    path = require('path'), 
    xml2js = require('xml2js');


var sockets = 0;
var client = knox.createClient(JSON.parse(fs.readFileSync('settings.js')));

var listbucket = function(client, prefix, n, callback, marker) {
    var step = 100;
    if (n > 0) {
        util.debug(n + ' records to process');
        var params = {
            'max-keys': step
        };
        prefix && (params.prefix = prefix);
        marker && (params.marker = marker);

        client.get('?' + querystring.stringify(params), {
        }).on('response', function(res) {
            res.setEncoding('utf8');
            var listing = '';
            res.on('data', function(chunk) {
                listing += chunk;
            })
            .on('end', function() {
                var parser = new xml2js.Parser();
                parser.addListener('end', function(result) {
                    callback(result.Contents);
                    if (result.IsTruncated.text == 'true') {
                        listbucket(client,
                            prefix,
                            n - step,
                            callback,
                            result
                                .Contents[result.Contents.length - 1]
                                .Key.text);
                    }
                });
                parser.parseString(listing);
            });
        }).end();
    }
};

/**
 * Server
 */

var app = module.exports = express.createServer();
var data_dir = 'data';
var PORT = 8892;

app.use(express.bodyDecoder());
app.use(express.staticProvider(__dirname + '/data'));

function jsonp(obj, req) {
  return req.param('jsoncallback') ?
    (req.param('jsoncallback') + '(' + JSON.stringify(obj) + ')') :
    obj;
}

app.get('/', function(req, res, params) {
  listbucket(client, '', 100, function(objects) {
    res.send(jsonp({
      name: 'S3 Provider',
      version: 1.0,
      datasources: _.map(objects, function(object) {
        return {
          url: url.format({
            host: client.bucket + '.s3.amazonaws.com',
            protocol: 'http:',
            pathname: object.Key.text
          }),
          bytes: object.Size.text
        };
      })
    }, req));
  });
});

app.listen(PORT);
