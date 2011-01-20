/**
 * Model: Datasource
 *
 * A single layer datasource, e.g. a shapefile.
 */
var Datasource = Backbone.Model.extend({});

/**
 * Collection: DatasourceListS3
 *
 * A list of datasources available on an S3 bucket.
 */
var DatasourceListS3 = Backbone.Collection.extend({
    model: Datasource,
    url: '/provider/s3',
    title: 'Amazon S3',
    comparator: function(model) {
        return model.id;
    }
});

/**
 * Collection: DatasourceListDirectory
 *
 * A list of datasources available via local directory.
 */
var DatasourceListDirectory = Backbone.Collection.extend({
    model: Datasource,
    url: '/provider/directory',
    title: 'Local directory',
    comparator: function(model) {
        return model.id;
    }
});

/**
 * View: DatasourceListView
 *
 * A list of datasources for a given collection.
 */
var DatasourceListView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.collection.bind('all', this.render);
        this.collection.fetch();
    },
    render: function () {
        var self = this;
        $(self.el).append('<h3>' + this.collection.title + '</h3>')
        if (this.collection.length) {
            this.collection.each(function(model) {
                var datasourceRow = new DatasourceRowView({
                    model: model,
                    target: self.options.target
                });
                $(self.el).append(datasourceRow.el);
            });
        }
        else {
            $(self.el).append('<div class="empty">No datasources found.</div>')
        }
        return this;
    }
});

/**
 * View: DatasourceRowView
 *
 * A single datasource row in a DatasourceListView.
 */
var DatasourceRowView = Backbone.View.extend({
    tagName: 'a',
    className: 'datasource',
    initialize: function() {
        _.bindAll(this, 'render', 'setfield');
        this.render();
    },
    render: function() {
        $(this.el).html(ich.DatasourceRow({
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

