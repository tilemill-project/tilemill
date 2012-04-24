var assert = require('assert');
var core;
var tile;

describe('tile endpoint', function() {

before(function(done) {
    require('./support/start').start(function(command) {
        core = command.servers['Core'];
        tile = command.servers['Tile'];
        done();
    });
});

after(function(done) {
    core.close();
    tile.close();
    done();
});

it('should 404 for missing project', function(done) {
    assert.response(tile,
        { url: '/tile/does_not_exist/0/0/0.png', encoding: 'binary' },
        { body: /Project does not exist/, status: 404 },
        function() { done(); }
    );
});
it ('should 200 (tile) for existing project', function(done) {
    assert.response(tile,
        { url: '/tile/demo_01/2/2/1.png', encoding: 'binary' },
        { status: 200 },
        function(res) {
            assert.equal(res.body.length, 18568);
            done();
        }
    );
});
it ('should 200 (grid) for existing project', function(done) {
    assert.response(tile,
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
            done();
        }
    );
});

});
