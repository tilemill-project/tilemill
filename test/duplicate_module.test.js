var assert = require('assert');
var exec = require('child_process').exec;

var count_module = function(name,callback) {
    var cmd = 'npm ls ' + name;
    exec(cmd,
        function (error, stdout, stderr) {
            var pattern = new RegExp(name+'@','g');
            var match = stdout.match(pattern);
            if (!match) {
                return callback(null,0);
            }
            return callback(null,match.length);
    });
};

describe('config loading pwnage', function() {

['optimist','sqlite3','mapnik'].forEach(function(mod) {
    it('there should only be one ' + mod + ' module otherwise you are hosed', function(done) {
         count_module(mod, function(err,count) {
            if (err) throw err;
            assert.notEqual(count,0,'you are missing the ' + mod + ' module (`npm ls ' + mod + '`)');
            assert.equal(count,1,'you have more than one copy of ' + mod + ' (`npm ls ' + mod + '`)');
            done();
        });
    });
});

});