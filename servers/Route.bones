servers['Route'].augment({
    assets: {
        styles: [
            require.resolve('../assets/css/reset.css'),
            require.resolve('../assets/css/style.css'),
            require.resolve('../assets/css/controls.css'),
            require.resolve('../assets/css/codemirror.css'),
            require.resolve('../assets/css/code.css')
        ],
        scripts: [
            require.resolve('../assets/js/colorpicker.classic.js'),
            require.resolve('../assets/js/mustache.js'),
            require.resolve('../assets/js/jquery.ui.js'),
            require.resolve('chrono/lib/chrono.js'),
            require.resolve('wax/ext/modestmaps.min.js'),
            require.resolve('wax/dist/wax.mm.min.js'),
            require.resolve('JSV/lib/uri/uri.js'),
            require.resolve('JSV/lib/jsv.js'),
            require.resolve('JSV/lib/json-schema-draft-03.js'),
            require.resolve('../assets/js/codemirror.js'),
            require.resolve('../assets/js/codemirror.overlay.js'),
            require.resolve('../assets/js/codemirror.carto.js'),
            require.resolve('../assets/js/codemirror.xml.js'),
            require.resolve('../assets/js/codemirror.mustache.js'),
            require.resolve('node-markdown/lib/vendor/showdown/compressed/showdown.js'),
            require.resolve('sphericalmercator')
        ]
    },
    initializeAssets: function(parent, app) {
        parent.call(this, app);
        this.get('/assets/tilemill/css/vendor.css',
            mirror.assets(this.assets.styles, { type: '.css' }).handler);
        this.get('/assets/tilemill/js/vendor.js',
            mirror.assets(this.assets.scripts, { type: '.js' }).handler);
    }
});

