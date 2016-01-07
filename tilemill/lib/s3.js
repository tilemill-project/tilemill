// Utilities for listing assets in an S3 library.
var http = require('http');
var sax = require('sax');
var url = require('url');
var _ = require('underscore');
var querystring = require('querystring');
var path = require('path');

// Small wrapper around sax-js for convenience.
function parseXML(xml, callback) {
    var parser = sax.parser(true);
    var tree = [ {} ];

    parser.onopentag = function(node) {
        if (!(node.name in tree[0])) tree[0][node.name] = [];
        tree[0][node.name].push(node.attributes);
        tree.unshift(node.attributes);
    };

    parser.onclosetag = function() {
        tree.shift();
        if (tree.length === 1) callback(tree[0]);
    };

    parser.ontext = parser.oncdata = function(text) {
        if (text.trim()) tree[0].text = (tree[0].text || '') + text;
    };

    parser.write(xml.toString());
};

// Retrieve the contents of an S3 bucket, limiting to the formats accepted
// by `filterformat()`. The number of items requested at a time is
// *arbitrarily* twice the length of the actual requested items assuming
// that no more than half the items are filtered out by `filterformat()`.
// Buckets with a higher proportion of noise may require a higher
// multiplier.
function list(options, callback) {
    options = options || {};
    options.objects = options.objects || [];
    options.bucket = options.bucket || '';
    options.prefix = options.prefix || '';

    // If there is a prefix, it needs to end in the delimiter.
    if (options.prefix && options.prefix.charAt(options.prefix.length - 1) !== '/') {
        options.prefix += '/';
    }

    // Limit the number of items returned by S3 to 100. Query multiple times
    // in order to retrieve the full set.
    var params = {
        'max-keys':100,
        'delimiter':'/'
    };
    options.prefix && (params.prefix = options.prefix);
    options.marker && (params.marker = options.marker);

    var proxy = options.proxy ? url.parse(options.proxy) : undefined,
        host = options.bucket + '.s3.amazonaws.com',
        query = '/?' + querystring.stringify(params);

    var requestOpts = proxy ? {
        hostname: proxy.hostname,
        port: proxy.port,
        path: 'http://' + host + query,
        headers: {
            Host: host
        }
    } : {
        hostname: host,
        path: query
    };
    if (proxy && proxy.auth) {
        requestOpts.headers['proxy-authorization'] =
            'Basic ' + new Buffer(proxy.auth).toString('base64');
    }

    var req = http.get(requestOpts);
    req.on('error',function(err) {
        return callback(err);
    });
    req.on('response', function(res) {
        res.on('error', function(err) {
            return callback(err);
        });
        var xml = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            xml += chunk;
        });
        res.on('end', function() {
            parseXML(xml, function(result) {
                if (!result.ListBucketResult) return callback(null, []);

                var result = result.ListBucketResult[0];
                var objects = (result.Contents || []).concat(result.CommonPrefixes || []);
                var truncated = result.IsTruncated && result.IsTruncated[0].text == 'true';
                var marker = result.Contents
                    ? result.Contents[result.Contents.length - 1].Key[0].text
                    : null;

                options.objects = options.objects.concat(objects);

                // There are more results to retrieve, query again.
                if (truncated && marker) {
                    options.marker = marker;
                    list(options, callback);
                // We have the full list.
                } else {
                    callback(null, options.objects);
                }
            });
        });
    });
    req.end();
};

module.exports = { list:list };

