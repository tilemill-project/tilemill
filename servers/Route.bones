var mapnik = require('tilelive-mapnik/node_modules/mapnik');
var abilities = {
    carto: require('tilelive-mapnik/node_modules/carto').tree.Reference.data,
    fonts: mapnik.fonts(),
    datasources: mapnik.datasources(),
    exports: {
        mbtiles: true,
        png: true,
        pdf: mapnik.supports.cairo
    }
};

servers['Route'].augment({
    assets: {
        styles: [
            require.resolve('../build/vendor.css'),
            require.resolve('../assets/css/reset.css'),
            require.resolve('../assets/css/style.css'),
            require.resolve('../assets/css/controls.css'),
            require.resolve('../assets/css/code.css')
        ],
        scripts: [
            // require.resolve('../assets/js/libraries/jquery-ui.js'),
            // require.resolve('../assets/js/libraries/colorpicker/js/colorpicker.js'),
            require.resolve('../build/vendor.js'),
            require.resolve('wax/ext/modestmaps.min.js'),
            require.resolve('wax/dist/wax.mm.min.js'),
            require.resolve('JSV/lib/uri/uri.js'),
            require.resolve('JSV/lib/jsv.js'),
            require.resolve('JSV/lib/json-schema-draft-03.js'),
            require.resolve('../assets/js/mm.signed.js'),
            require.resolve('../assets/js/codemirror.carto.js'),
        ]
    },
    initializeAssets: function(parent, app) {
        parent.call(this, app);
        this.get('/assets/tilemill/css/vendor.css',
            mirror.assets(this.assets.styles, { type: '.css' }));
        this.get('/assets/tilemill/js/vendor.js',
            mirror.assets(this.assets.scripts, { type: '.js' }));
        this.get('/assets/tilemill/js/abilities.js', this.abilities);
    }
});

servers['Route'].prototype.abilities = function(req, res, next) {
    var js = 'var abilities = ' + JSON.stringify(abilities) + ';';
    res.send(js, {'Content-type': 'text/javascript'});
};
