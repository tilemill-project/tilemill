servers['Route'].augment({
    client: {
        styles: [
            require.resolve('../build/vendor.css'),
            require.resolve('../client/css/reset.css'),
            require.resolve('../client/css/tilemill.css'),
            require.resolve('../client/css/code.css')
        ],
        scripts: [
            require.resolve('../client/js/libraries/jquery-ui.js'),
            require.resolve('../client/js/libraries/colorpicker/js/colorpicker.js'),
            require.resolve('../build/vendor.js'),
            require.resolve('wax/build/wax.mm.min.js'),
            require.resolve('JSV/lib/uri/uri.js'),
            require.resolve('JSV/lib/jsv.js'),
            require.resolve('JSV/lib/json-schema-draft-03.js')
        ]
    },
    initializeclient: function(parent, app) {
        parent.call(this, app);
        this.get('/client/tilemill/css/vendor.css',
            mirror.client(this.client.styles, { type: '.css' }));
        this.get('/client/tilemill/js/vendor.js',
            mirror.client(this.client.scripts, { type: '.js' }));
    }
});
