var assert = require('assert');
var exec = require('child_process').exec;

var count_module = function(name,callback) {
    var cmd = 'npm ls ' + name;
    exec(cmd,
        function (error, stdout, stderr) {
        return callback(null,stdout.match(new RegExp(name+'@','g')).length);
    });
};

describe('config loading pwnage', function() {

['optimist','sqlite3','mapnik'].forEach(function(mod) {
    it('there should only be one ' + mod + ' module otherwise you are hosed', function(done) {
         count_module(mod, function(err,count) {
            if (err) throw err;
            assert.equal(count,1,'you have more than one copy of ' + mod + ' (based on npm ls output)')
            done();
        });
    });
});

});