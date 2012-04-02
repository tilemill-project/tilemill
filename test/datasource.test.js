var assert = require('assert');
var fs = require('fs');
var path = require('path');
var core;
var tile;

function readJSON(name) {
    var json = fs.readFileSync(path.resolve(__dirname + '/fixtures/' + name + '.json'), 'utf8');
    return JSON.parse(json);
}

describe('datasource', function() {

before(function(done) {
    require('./support/start').startPostgis(function(command) {
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

it('GET sqlite', function(done) {
    assert.response(tile,
        { url: '/datasource/world?file=' + encodeURIComponent(__dirname + '/fixtures/countries.sqlite') + '&table=countries&id=world&type=sqlite&project=demo_01&srs=null' },
        { status: 200 },
        function(res) {
            var body = JSON.parse(res.body), datasource = readJSON('datasource-sqlite');
            datasource.url = __dirname + '/fixtures/countries.sqlite';
            assert.deepEqual(datasource, body);
            done();
        }
    );
});

it('GET shapefile datasource', function(done) {
    assert.response(tile,
        { url: '/datasource/world?file=http%3A%2F%2Ftilemill-data.s3.amazonaws.com%2Fworld_borders_merc.zip&type=shape&id=world&project=demo_01' },
        { status: 200 },
        function(res) {
            var body = JSON.parse(res.body);
            assert.deepEqual(readJSON('datasource-shp'), body);
            done();
        }
    );
});

it('GET shapefile datasource with features', function(done) {
    assert.response(tile,
        { url: '/datasource/world?file=http%3A%2F%2Ftilemill-data.s3.amazonaws.com%2Fworld_borders_merc.zip&type=shape&id=world&project=demo_01&features=true' },
        { status: 200 },
        function(res) {
            var body = JSON.parse(res.body);
            assert.deepEqual(readJSON('datasource-shp-features'), body);
            done();
        }
    );
});

it('GET postgis datasource', function(done) {
    assert.response(tile,
        { url: '/datasource/postgis?table%3D%2210m-admin-0-boundary-lines-land%22&key_field=&geometry_field=&extent=-15312095%2C-6980576.5%2C15693558%2C11093272&type=postgis&dbname=tilemill_test&id=postgis&srs=%2Bproj%3Dmerc+%2Ba%3D6378137+%2Bb%3D6378137+%2Blat_ts%3D0.0+%2Blon_0%3D0.0+%2Bx_0%3D0.0+%2By_0%3D0+%2Bk%3D1.0+%2Bunits%3Dm+%2Bnadgrids%3D%40null+%2Bwktext+%2Bno_defs+%2Bover&project=demo_01' },
        { status: 200 },
        function(res) {
            var body = JSON.parse(res.body);
            assert.deepEqual(readJSON('datasource-postgis'), body);
            done();
        }
    );
});

it('GET postgis datasource with features', function(done) {
    assert.response(tile,
        { url: '/datasource/postgis?table%3D%2210m-admin-0-boundary-lines-land%22&key_field=&geometry_field=&extent=-15312095%2C-6980576.5%2C15693558%2C11093272&type=postgis&dbname=tilemill_test&id=postgis&srs=%2Bproj%3Dmerc+%2Ba%3D6378137+%2Bb%3D6378137+%2Blat_ts%3D0.0+%2Blon_0%3D0.0+%2Bx_0%3D0.0+%2By_0%3D0+%2Bk%3D1.0+%2Bunits%3Dm+%2Bnadgrids%3D%40null+%2Bwktext+%2Bno_defs+%2Bover&project=demo_01&features=true' },
        { status: 200 },
        function(res) {
            var body = JSON.parse(res.body);
            assert.deepEqual(readJSON('datasource-postgis-features'), body);
            done();
        }
    );
});

});
