// Plugin for using an Amazon S3 bucket as a Library. Generates the payload for
// an AssetListS3 REST endpoint consisting of asset models as well as the S3
// specific `marker`.
var knox = require('knox'),
    url = require('url'),
    _ = require('underscore'),
    querystring = require('querystring'),
    path = require('path'), 
    xml2js = require('xml2js');

module.exports = function(app, options, callback) {
    // Retrieve the contents of an S3 bucket, limiting to the formats accepted
    // by `filterformat()`. The number of items requested at a time is
    // *arbitrarily* twice the length of the actual requested items assuming
    // that no more than half the items are filtered out by `filterformat()`.
    // Buckets with a higher proportion of noise may require a higher
    // multiplier.
    var listbucket = function(client, options, callback) {
        options = options || {};
        options.limit = options.limit || 10;

        // Limit the number of items returned by S3 to 100. If the
        // `options.limit` is greater than this size, query multiple times
        // in order to retrieve the full set.
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

                    // There are more results to retrieve, query again.
                    if (truncated && objects.length < options.limit) {
                        options.objects = objects;
                        options.marker = marker;
                        listbucket(client, options, callback);
                    // We have the full list.
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

    // Filter an array of S3 objects where filenames match the regex.
    var filterformat = function(object) {
        return (object.Size.text !== '0') &&
        (object.Key.text.match(/(.zip|.geojson|.tiff?|.geotiff|.vrt|.kml)/i));
    };

    // Convert a list of S3 objects to asset models.
    var toModel = function(object) {
        return {
            url: url.format({
                host: options.s3_bucket + '.s3.amazonaws.com',
                protocol: 'http:',
                pathname: object.Key.text
            }),
            bytes: (Math.ceil(parseInt(object.Size.text) / 1048576)) + ' MB',
            id: path.basename(object.Key.text)
        };
    };

    var client = knox.createClient({
        bucket: options.s3_bucket,
        key: options.s3_key,
        secret: options.s3_secret
    });

    var opts = { limit: options.limit };

    // Markers can include URL-unsafe characters so they are url-safe base64
    // encoded by the client. The marker param is decoded here before being
    // passed through to S3.
    if (options.page && options.page != 0) {
        opts.marker = options.page.replace('+', '-').replace('/', '_');
        opts.marker = (new Buffer(opts.marker, 'base64')).toString('utf-8');
    }

    listbucket(client, opts, function(err, res) {
        callback({
            marker: res.marker,
            models: _.map(res.objects, toModel)
        });
    });
};

