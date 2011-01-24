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

function formatbyte(n) {
    return (Math.ceil(parseInt(n) / 1048576)) + ' MB';
}

module.exports = function(app, settings) {
  return {
    name: 'Amazon S3',
    settings: settings,
    objects: function(callback) {
      var client = knox.createClient(settings.providers.s3);
        listbucket(client, '', 100, function(objects) {
          // TODO: don't list directories
          // TODO: only list public files
          callback(_.map(_.filter(objects, 
            function(object) {
              return (object.Size.text !== '0') &&
                (object.Key.text.match(/(.zip|.geojson)/i));
            }), function(object) {
            return {
              url: url.format({
                host: client.bucket + '.s3.amazonaws.com',
                protocol: 'http:',
                pathname: object.Key.text
              }),
              bytes: formatbyte(object.Size.text),
              id: path.basename(object.Key.text)
            };
          })
        )
      })
    }
  }
};
