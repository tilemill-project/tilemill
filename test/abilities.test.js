var assert = require('assert');
var core;
var tile;

describe('abilities', function() {

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

it('GET should return JSON', function(done) {
    assert.response(core,
        { url: '/assets/tilemill/js/abilities.js' },
        { status: 200 },
        function(res) {
            var body = res.body.replace(/^\s*var\s+abilities\s*=\s*(.+?);?$/, '$1');
            var abilities = JSON.parse(body);
            // travis does a shallow clone so the git version and hash will
            // not be known, which is harmless
            if (!process.env.TRAVIS && !process.env.APPVEYOR) {
                assert.ok(/v\d+.\d+.\d+-\d+-[a-z0-9]+/.test(abilities.version[0]),abilities.version[0]);
                assert.ok(/\d+.\d+.\d+.\d+/.test(abilities.version[1]),abilities.version[1]);
            }
            assert.ok(abilities.fonts.indexOf('Arial Regular') >= 0 ||
                      abilities.fonts.indexOf('DejaVu Sans Book') >= 0);
            assert.deepEqual([0,206,209], abilities.carto.colors.darkturquoise);
            assert.deepEqual([
                "background-color",
                "background-image",
                "background-image-comp-op",
                "background-image-opacity",
                "srs",
                "buffer-size",
                "maximum-extent",
                "base",
                "paths-from-xml",
                "minimum-version",
                "font-directory"
            ], Object.keys(abilities.carto.symbolizers.map));
            assert.equal(true,abilities.exports.mbtiles);
            done();
        }
    );
});

});

