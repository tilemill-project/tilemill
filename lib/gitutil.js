var exec = require('child_process').exec;
var fs = require('fs');

var child = exec('git describe --tags',
  function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    } else {
        var hash = stdout;
        var version_file = hash + hash.slice(1,-10).replace('-','.') + '\n';
        fs.writeFileSync('VERSION',version_file);
    }
});