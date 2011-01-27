var knox = require('knox'),
    sys = require('sys'),
    fs = require('fs'),
    url = require('url'),
    util = require('util'),
    _ = require('underscore')._,
    express = require('express'),
    querystring = require('querystring'),
    path = require('path'), 
    xml2js = require('xml2js'),
    Settings = require('project').Settings;

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
            if (result.IsTruncated && result.IsTruncated.text == 'true') {
              callback(result.Contents, true);
              listbucket(client,
                prefix,
                n - step,
                callback,
                result
                  .Contents[result.Contents.length - 1]
                  .Key.text);
            }
            else {
              callback(result.Contents, false);
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
      var client = knox.createClient({
        bucket: settings.get('s3_bucket'),
        key: settings.get('s3_key'),
        secret: settings.get('s3_secret')
      });
      var keys = [];
      listbucket(client, '', 1000, function(objects, more) {
        // TODO: don't list directories
        // TODO: only list public files
        keys = keys.concat(objects);
        if (!more) {
          callback(_.map(_.filter(keys,
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
          );
        }
      });
    }
  }
};
