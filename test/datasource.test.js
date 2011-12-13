var assert = require('assert'),
    fs = require('fs');

function readJSON(name) {
    var json = fs.readFileSync('./test/fixtures/' + name + '.json', 'utf8');
    return JSON.parse(json);
}

require('./support/start')(function(command) {

    exports['test sqlite datasource'] = function() {
        assert.response(command.servers['Tile'],
            { url: '/datasource/world?file=' + encodeURIComponent(__dirname + '/fixtures/countries.sqlite') + '&table=countries&id=world&type=sqlite&project=demo_01&srs=null' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body), datasource = readJSON('datasource-sqlite');
                datasource.url = __dirname + '/fixtures/countries.sqlite';
                assert.deepEqual(datasource, body);
            }
        );
    };

    /* disable back to back shapefile tests to avoid crash
       until the root cause is clear: https://github.com/mapbox/tilemill/issues/1006
    */
    
    /*exports['test shapefile datasource'] = function() {
        assert.response(command.servers['Core'],
            { url: '/api/Datasource/world?file=http%3A%2F%2Ftilemill-data.s3.amazonaws.com%2Fworld_borders_merc.zip&type=shape&id=world&project=demo_01' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                assert.deepEqual(readJSON('datasource-shp'), body);
            }
        );
    };
    */

    exports['test shapefile datasource with features'] = function() {
        assert.response(command.servers['Tile'],
            { url: '/datasource/world?file=http%3A%2F%2Ftilemill-data.s3.amazonaws.com%2Fworld_borders_merc.zip&type=shape&id=world&project=demo_01&features=true' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                assert.deepEqual(readJSON('datasource-shp-features'), body);
            }
        );
    };

    exports['test postgis datasource'] = function() {
        assert.response(command.servers['Tile'],
            { url: '/datasource/postgis?table%3D%2210m-admin-0-boundary-lines-land%22&key_field=&geometry_field=&extent=-15312095%2C-6980576.5%2C15693558%2C11093272&type=postgis&dbname=tilemill_test&id=postgis&srs=%2Bproj%3Dmerc+%2Ba%3D6378137+%2Bb%3D6378137+%2Blat_ts%3D0.0+%2Blon_0%3D0.0+%2Bx_0%3D0.0+%2By_0%3D0+%2Bk%3D1.0+%2Bunits%3Dm+%2Bnadgrids%3D%40null+%2Bwktext+%2Bno_defs+%2Bover&project=demo_01' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                assert.deepEqual(readJSON('datasource-postgis'), body);
            }
        );
    };

    exports['test postgis datasource with features'] = function() {
        assert.response(command.servers['Tile'],
            { url: '/datasource/postgis?table%3D%2210m-admin-0-boundary-lines-land%22&key_field=&geometry_field=&extent=-15312095%2C-6980576.5%2C15693558%2C11093272&type=postgis&dbname=tilemill_test&id=postgis&srs=%2Bproj%3Dmerc+%2Ba%3D6378137+%2Bb%3D6378137+%2Blat_ts%3D0.0+%2Blon_0%3D0.0+%2Bx_0%3D0.0+%2By_0%3D0+%2Bk%3D1.0+%2Bunits%3Dm+%2Bnadgrids%3D%40null+%2Bwktext+%2Bno_defs+%2Bover&project=demo_01&features=true' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                assert.deepEqual(readJSON('datasource-postgis-features'), body);
            }
        );
    };
});
