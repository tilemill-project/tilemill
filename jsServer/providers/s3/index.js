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

/*
var client = knox.createClient(settings);
app.get('/', function(req, res, params) {
  listbucket(client, '', 100, function(objects) {
    res.send(jsonp({
      name: 'S3',
      version: 1.0,
      datasources: _.map(objects, function(object) {
        return {
          url: url.format({
            host: client.bucket + '.s3.amazonaws.com',
            protocol: 'http:',
            pathname: object.Key.text
          }),
          bytes: object.Size.text,
          name: path.basename(object.Key.text)
        };
      })
    }, req));
  });
});

*/

module.exports = function(settings) {
    return {
        settings: settings
    }
};
