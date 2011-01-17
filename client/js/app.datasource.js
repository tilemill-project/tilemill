var Datasource = Backbone.Model.extend({
});

var DatasourceListS3 = Backbone.Collection.extend({
    model: Datasource,
    url: '/provider/s3',
    title: 'Amazon S3',
    comparator: function(model) {
        return model.id;
    }
});

var DatasourceListDirectory = Backbone.Collection.extend({
    model: Datasource,
    url: '/provider/directory',
    title: 'Local directory',
    comparator: function(model) {
        return model.id;
    }
});

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
    },
});

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

