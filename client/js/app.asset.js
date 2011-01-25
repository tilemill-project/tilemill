/**
 * Model: Asset
 *
 * An external asset, e.g. a shapefile, image, etc.
 */
var Asset = Backbone.Model.extend({});

/**
 * Collection: AssetListS3
 *
 * A list of assets available on an S3 bucket.
 */
var AssetListS3 = Backbone.Collection.extend({
    model: Asset,
    url: '/provider/s3',
    title: 'Amazon S3',
    comparator: function(model) {
        return model.id;
    }
});

/**
 * Collection: AssetListDirectory
 *
 * A list of assets available via local directory.
 */
var AssetListDirectory = Backbone.Collection.extend({
    model: Asset,
    url: '/provider/directory',
    title: 'Local directory',
    comparator: function(model) {
        return model.id;
    }
});

/**
 * View: AssetListView
 *
 * A list of assets for a given collection.
 */
var AssetListView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        // this.collection.bind('all', this.render);
        this.collection.fetch({
            success: this.render,
            error: this.render
        });
    },
    render: function () {
        var self = this;
        $(self.el).append('<h3>' + this.collection.title + '</h3>')
        if (this.collection.length) {
            this.collection.each(function(model) {
                var assetRow = new AssetRowView({
                    model: model,
                    target: self.options.target
                });
                $(self.el).append(assetRow.el);
            });
        }
        else {
            $(self.el).append('<div class="empty">No assets found.</div>')
        }
        return this;
    }
});

/**
 * View: AssetRowView
 *
 * A single asset row in a AssetListView.
 */
var AssetRowView = Backbone.View.extend({
    tagName: 'a',
    className: 'asset',
    initialize: function() {
        _.bindAll(this, 'render', 'setfield');
        this.render();
    },
    render: function() {
        $(this.el).html(ich.AssetRowView({
            id: this.model.id,
            bytes: this.model.get('bytes'),
            url: this.model.get('url')
        }));
        return this;
    },
    events: {
        'click': 'setfield'
    },
    setfield: function() {
        this.options.target.val(this.model.get('url'));
    }
});

