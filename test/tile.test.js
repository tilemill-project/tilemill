var assert = require('assert');

require('./support/start')(function(command) {
    exports['test non-existant 1.0.0 tile endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/1.0.0/does_not_exist/0/0/0.png', encoding: 'binary' },
            { body: /Project does not exist/, status: 404 }
        );
    };

    exports['test 1.0.0 tile endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/1.0.0/demo_01/0/0/0.png', encoding: 'binary' },
            { status: 200 },
            function(res) {
                assert.equal(res.body.length, 15990);
            }
        );
    };

    exports['test 1.0.0 tile endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/1.0.0/demo_01/2/2/2.png', encoding: 'binary' },
            { status: 200 },
            function(res) {
                assert.equal(res.body.length, 18592);
            }
        );
    };
});
