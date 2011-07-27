var assert = require('assert');
var fs = require('fs');

function readJSON(name) {
    var json = fs.readFileSync('./test/fixtures/' + name + '.json', 'utf8');
    return JSON.parse(json);
}

require('./support/start')(function(command) {
    exports['test project collection endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/api/Datasource/world?file=http%3A%2F%2Ftilemill-data.s3.amazonaws.com%2Fworld_borders_merc.zip&type=shape&id=world&project=asdf&features=true' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                assert.deepEqual(readJSON('datasource'), body);
            }
        );
    };
});
