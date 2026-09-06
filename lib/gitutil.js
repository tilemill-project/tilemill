// Create the VERSION file which will be read by commands/core.bones to populate the unique version
// in the heading of the project settings page.
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
            //var version_file = hash + hash.slice(1, -10).replace('-', '.') + '\n';
            var version_file = hash;
            fs.writeFileSync('VERSION', version_file);
        } else {
            // no tag found likely due to shallow clone (--depth=N)
            var version_file = 'v' + package_json.version + '-' + hash;
            fs.writeFileSync('VERSION', version_file);
        }
    }
});

// Record which git remote/branch this checkout was built from, so forks and
// branches can be distinguished from the canonical repo in anonymous system
// profile reports (see lib/stats.js). Written at install-time for the same
// reason VERSION is: a distributed/packaged copy may not have a .git dir.
exec('git remote get-url origin', function(error, remoteStdout) {
    exec('git rev-parse --abbrev-ref HEAD', function(error2, branchStdout) {
        var repo_file = JSON.stringify({
            remote: error ? 'unknown' : remoteStdout.trim(),
            branch: error2 ? 'unknown' : branchStdout.trim()
        }, null, 2);
        fs.writeFileSync('REPO', repo_file);
    });
});
