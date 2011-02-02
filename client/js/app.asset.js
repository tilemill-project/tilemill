/**
 * View: AssetListView
 *
 * A list of assets for a given collection.
 */
var AssetListView = Backbone.View.extend({
    id: 'AssetListView',
    initialize: function () {
        _.bindAll(this, 'render');
        this.collection.fetch({
            success: this.render,
            error: this.render
        });
    },
    render: function () {
        var self = this;
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
    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function() {
        $(this.el).html(ich.AssetRowView({
            id: this.model.id,
            bytes: this.model.get('bytes'),
            url: this.model.get('url'),
            type: this.model.extension()
        }));
        return this;
    }
});

