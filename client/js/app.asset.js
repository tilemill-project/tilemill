/**
 * View: AssetListView
 *
 * A list of assets for a given collection.
 */
var AssetListView = Backbone.View.extend({
    id: 'AssetListView',
    events: {
        'click a.next': 'next',
        'click a.prev': 'prev'
    },
    initialize: function () {
        _.bindAll(this, 'render', 'prev', 'next', 'loading', 'done');
        this.collection.bind('all', this.render);
        this.render();
    },
    render: function () {
        $(this.el).html(ich.AssetListView({
            hasNext: this.collection.hasNext(),
            hasPrev: this.collection.hasPrev()
        }));

        var that = this;
        if (this.collection.length) {
            this.collection.each(function(model) {
                var assetRow = new AssetRowView({
                    model: model,
                    target: that.options.target
                });
                that.$('ul.assets').append(assetRow.el);
            });
        } else {
            that.$('ul.assets').append('<li class="empty">No assets found.</li>')
        }
        return this;
    },
    next: function(ev) {
        if ($(ev.currentTarget).is('.disabled')) return false;
        var that = this;
        this.loading('Loading assets');
        this.collection.nextPage({
            success: that.done,
            error: that.done
        });
        return false;
    },
    prev: function(ev) {
        if ($(ev.currentTarget).is('.disabled')) return false;
        var that = this;
        this.loading('Loading assets');
        this.collection.prevPage({
            success: that.done,
            error: that.done
        });
        return false;
    },
    loading: function(message) {
        if (this.loadingView) return;
        this.loadingView = new LoadingView({message: message});
        $(this.el).append(this.loadingView.el);
    },
    done: function() {
        if (!this.loadingView) return;
        this.loadingView.remove();
        delete this.loadingView;
    }
});

/**
 * View: AssetRowView
 *
 * A single asset row in a AssetListView.
 */
var AssetRowView = Backbone.View.extend({
    tagName: 'li',
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

