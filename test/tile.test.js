var assert = require('assert');

require('./support/start')(function(command) {
    exports['test non-existant tile endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/tile/does_not_exist/0/0/0.png', encoding: 'binary' },
            { body: /Project does not exist/, status: 404 }
        );
    };

    exports['test tile endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/tile/demo_01/2/2/1.png', encoding: 'binary' },
            { status: 200 },
            function(res) {
                assert.equal(res.body.length, 18568);
            }
        );
    };
});
