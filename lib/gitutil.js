var exec = require('child_process').exec;
var fs = require('fs');
var package_json = require('../package.json');

var child = exec('git describe --tags --always',
  function(error, stdout, stderr) {
    if (error !== null) {
        console.log('exec error: ' + error);
    } else {
        var hash = stdout;
        if (hash[0] == 'v') {
            // git describe actually found a tag
            var version_file = hash + hash.slice(1, -10).replace('-', '.') + '\n';
            fs.writeFileSync('VERSION', version_file);
        } else {
            // no tag found likely due to shallow clone (--depth=N)
            var version_file = 'v' + package_json.version + '-' + hash;
            fs.writeFileSync('VERSION', version_file);
        }
    }
});
