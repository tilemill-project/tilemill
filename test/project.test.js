var assert = require('assert');

function removeTimestamp(url) {
    return url.replace(/\?\d+$/, '');
}

function cleanProject(proj) {
    if (!proj) return;
    delete proj._updated;
    if (Array.isArray(proj.tiles)) proj.tiles = proj.tiles.map(removeTimestamp);
    if (Array.isArray(proj.grids)) proj.grids = proj.grids.map(removeTimestamp);
}

require('./support/start')(function(command) {
    exports['test project collection endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/api/Project' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                cleanProject(body[0]);
                assert.deepEqual([{
                    "bounds": [-180, -90, 180, 90],
                    "center": [0, 0, 2],
                    "format": "png",
                    "interactivity": false,
                    "minzoom": 0,
                    "maxzoom": 22,
                    "srs": "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over",
                    "Stylesheet": [{
                        "id": "style.mss",
                        "data": "Map {\n  background-color: #fff;\n}\n\n#world {\n  polygon-fill: #eee;\n  line-color: #ccc;\n  line-width: 0.5;\n}"
                    }],
                    "Layer": [{
                        "id": "world",
                        "name": "world",
                        "srs": "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over",
                        "geometry": "polygon",
                        "Datasource": {
                            "file": "http://tilemill-data.s3.amazonaws.com/world_borders_merc.zip",
                            "type": "shape"
                        }
                    }],
                    "id": "demo_01",
                    "tilejson": "1.0.0",
                    "scheme": "tms",
                    "tiles": ["/1.0.0/demo_01/{z}/{x}/{y}.png"],
                    "grids": ["/1.0.0/demo_01/{z}/{x}/{y}.grid.json"]
                }], body);
            }
        );
    };

    exports['test project endpoint'] = function() {
        assert.response(command.servers['Core'],
            { url: '/api/Project/demo_01' },
            { status: 200 },
            function(res) {
                var body = JSON.parse(res.body);
                cleanProject(body);
                assert.deepEqual({
                    "bounds": [-180, -90, 180, 90],
                    "center": [0, 0, 2],
                    "format": "png",
                    "interactivity": false,
                    "minzoom": 0,
                    "maxzoom": 22,
                    "srs": "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over",
                    "Stylesheet": [{
                        "id": "style.mss",
                        "data": "Map {\n  background-color: #fff;\n}\n\n#world {\n  polygon-fill: #eee;\n  line-color: #ccc;\n  line-width: 0.5;\n}"
                    }],
                    "Layer": [{
                        "id": "world",
                        "name": "world",
                        "srs": "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over",
                        "geometry": "polygon",
                        "Datasource": {
                            "file": "http://tilemill-data.s3.amazonaws.com/world_borders_merc.zip",
                            "type": "shape"
                        }
                    }],
                    "id": "demo_01",
                    "tilejson": "1.0.0",
                    "scheme": "tms",
                    "tiles": ["/1.0.0/demo_01/{z}/{x}/{y}.png"],
                    "grids": ["/1.0.0/demo_01/{z}/{x}/{y}.grid.json"]
                }, body);
            }
        );
    };
});
