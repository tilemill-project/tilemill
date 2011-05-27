servers['Route'].augment({
    assets: {
        styles: [
            require.resolve('../build/vendor.css'),
            require.resolve('../assets/css/reset.css'),
            require.resolve('../assets/css/style.css'),
            require.resolve('../assets/css/code.css')
        ],
        scripts: [
            // require.resolve('../assets/js/libraries/jquery-ui.js'),
            // require.resolve('../assets/js/libraries/colorpicker/js/colorpicker.js'),
            require.resolve('../build/vendor.js'),
            require.resolve('wax/build/wax.mm.min.js'),
            require.resolve('JSV/lib/uri/uri.js'),
            require.resolve('JSV/lib/jsv.js'),
            require.resolve('JSV/lib/json-schema-draft-03.js')
        ]
    },
    initializeAssets: function(parent, app) {
        parent.call(this, app);
        this.get('/assets/tilemill/css/vendor.css',
            mirror.assets(this.assets.styles, { type: '.css' }));
        this.get('/assets/tilemill/js/vendor.js',
            mirror.assets(this.assets.scripts, { type: '.js' }));
    }
});
