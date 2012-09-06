var assert = require('assert');
var exec = require('child_process').exec;

var count_module = function(name,callback) {
    exec('npm ls | grep ' + name,
        function (error, stdout, stderr) {
        //if (stderr) return callback(new Error(stderr));
        return callback(null,stdout.match(/@/g).length);
    });
};

describe('config loading pwnage', function() {

it('there should only be one optimist module otherwise you are hosed', function(done) {
     count_module('optimist', function(err,count) {
        if (err) throw err;
        assert.equal(count,1,'you have more than one copy of optimist')
        done();
    });
});

});