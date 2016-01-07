var path = require('path');
var child_process = require('child_process');

function check(callback) {
    if (process.platform == 'linux') {
        // lsb_release -rs
        child_process.exec('lsb_release -rs',
            function (error, stdout, stderr) {
                if (stdout && stdout.search('.') > -1) {
                    var major = parseInt(stdout.split('.')[0]);
                    var minor = parseInt(stdout.split('.')[1]);
                    // natty or before
                    if (major <= 10) {
                        return callback(true);
                    } else if (major === 11 && minor <= 4) {
                        return callback(true);
                    } else {
                        return callback(false);
                    }
                } else {
                    return callback(false);
                }
            });
    } else {
        return callback(false);
    }
}

function get_client(options) {
    //return require('topcube')(options);
    options.u = options.url
    options.n = options.name;
    options.W = options.width;
    options.H = options.height;
    options.w = options.minwidth;
    options.h = options.minheight;

    var client;
    var keys = [];
    switch (process.platform) {
    case 'linux':
        client = path.resolve(__dirname + (/0\.4\./.test(process.version) ? '/../node_modules/topcube/build/default/topcube' : '/../node_modules/topcube/build/Release/topcube'));
        //keys = ['url', 'name', 'width', 'height', 'minwidth', 'minheight'];
        keys = ['u', 'n', 'W', 'H', 'w', 'h'];
        break;
    default:
        console.warn('invalid platform for custom topcube client: ' + process.platform);
        return null;
        break;
    }

    var args = [];
    for (var key in options) {
        if (keys.indexOf(key) !== -1) {
            if (key.length == 1) {
                args.push('-' + key);
                args.push(options[key]);
            }
        }
    }
    var child = child_process.spawn(client, args);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('exit', function(code) {
        console.log('exiting custom topcube client');
        process.exit(code);
    });
    return child;
};

module.exports = {
    check: check,
    get_client: get_client
};
