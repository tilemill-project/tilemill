var knox = require('knox'),
    url = require('url'),
    _ = require('underscore')._,
    querystring = require('querystring'),
    path = require('path'), 
    xml2js = require('xml2js');

module.exports = function(app, options, callback) {
    var client = knox.createClient({
        bucket: options.s3_bucket,
        key: options.s3_key,
        secret: options.s3_secret
    });

    var opts = { limit: options.limit };
    if (options.page && options.page != 0) {
        opts.marker = options.page.replace('+', '-').replace('/', '_');
        opts.marker = (new Buffer(opts.marker, 'base64')).toString('utf-8');
    }

    function toModel(object) {
        return {
            url: url.format({
                host: client.bucket + '.s3.amazonaws.com',
                protocol: 'http:',
                pathname: object.Key.text
            }),
            bytes: formatbyte(object.Size.text),
            id: path.basename(object.Key.text)
        };
    }

    listbucket(client, opts, function(err, res) {
        callback({
            marker: res.marker,
            models: _.map(res.objects, toModel)
        });
    });
};

var listbucket = function(client, options, callback) {
    options = options || {};
    options.limit = options.limit || 10;

    var objects = options.objects || [];
    var step = (options.limit > 50) ? 50 : options.limit * 2;
    var params = {
        'max-keys': step * 2
    };
    options.prefix && (params.prefix = options.prefix);
    options.marker && (params.marker = options.marker);

    var req = client.get('?' + querystring.stringify(params));
    req.on('response', function(res) {
        var xml = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            xml += chunk;
        });
        res.on('end', function() {
            var parser = new xml2js.Parser();
            parser.addListener('end', function(result) {
                var truncated,
                    marker;

                objects = objects.concat(_.filter(result.Contents, filterformat));
                if (objects.length > options.limit) {
                    objects = objects.slice(0, options.limit);
                    truncated = true;
                    marker = objects[objects.length - 1].Key.text;
                } else {
                    truncated = result.IsTruncated && result.IsTruncated.text == 'true';
                    marker = objects[objects.length - 1].Key.text;
                }

                if (truncated && objects.length < options.limit) {
                    options.objects = objects;
                    options.marker = marker;
                    listbucket(client, options, callback);
                } else {
                    callback(null, {
                        marker: truncated ? marker : false,
                        objects: objects
                    });
                }
            });
            parser.parseString(xml);
        });
    });
    req.end();
};

var filterformat = function(object) {
    return (object.Size.text !== '0') &&
    (object.Key.text.match(/(.zip|.geojson|.tiff?|.geotiff|.vrt|.kml)/i));
};

var formatbyte = function(n) {
    return (Math.ceil(parseInt(n) / 1048576)) + ' MB';
};

