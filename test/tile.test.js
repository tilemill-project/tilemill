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

    exports['test grid endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/tile/demo_01/2/2/1.grid.json' },
            { status: 200 },
            function(res) {
                function grid(data) { return data; };
                var data = eval(res.body);
                assert.equal(data.grid.length, 64);
                assert.equal(data.keys.length, 90);
                assert.equal(Object.keys(data.data).length, 89);
                assert.equal(data.keys[1], '154');
                assert.equal(data.data['154'].NAME, 'Norway');
            }
        );
    };
});
